// --- DATA ---
const CATEGORIES = [
    { id: 'crops', name: 'Crop Produce', icon: 'leaf', img: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=400' },
    { id: 'animal', name: 'Animal-Based', icon: 'beef', img: 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&q=80&w=400' },
    { id: 'processed', name: 'Processed Goods', icon: 'package', img: 'https://images.unsplash.com/photo-1599599810694-b5ac4dd7c4c7?auto=format&fit=crop&q=80&w=400' },
    { id: 'seeds', name: 'Seeds & Planting', icon: 'sprout', img: 'https://images.unsplash.com/photo-1523348830342-d01f9fc11339?auto=format&fit=crop&q=80&w=400' },
    { id: 'byproducts', name: 'By-products', icon: 'recycle', img: 'https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?auto=format&fit=crop&q=80&w=400' },
    { id: 'medicinal', name: 'Medicinal', icon: 'activity', img: 'https://images.unsplash.com/photo-1585518419759-5ed1d1a98f9e?auto=format&fit=crop&q=80&w=400' },
    { id: 'forestry', name: 'Forestry Allied', icon: 'trees', img: 'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?auto=format&fit=crop&q=80&w=400' },
    { id: 'aquaculture', name: 'Aquaculture', icon: 'fish', img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400' }
];

const PRODUCTS = [
    // CROPS
    { id: 1, name: 'Sona Masuri Rice', category: 'crops', sub: 'Grains', price: 4500, unit: 'Quintal', rating: 4.8, location: 'Andhra Pradesh', img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=600', bulk: true, desc: 'Premium aged white rice with delicate aroma and high culinary yield.' },
    { id: 101, name: 'Alphonso Mangoes', category: 'crops', sub: 'Fruits', price: 1200, unit: 'Crate (12kg)', rating: 5.0, location: 'Ratnagiri', img: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&q=80&w=600', bulk: false, desc: 'GI-tagged Ratnagiri Hapus. Known for its rich, creamy texture and unique flavor.' },
    { id: 102, name: 'Byadgi Red Chillies', category: 'crops', sub: 'Spices', price: 3200, unit: 'Quintal', rating: 4.7, location: 'Karnataka', img: 'https://i.pinimg.com/1200x/11/fe/e7/11fee7bd6db305e2a54f990040d23586.jpg', bulk: true, desc: 'High oleoresin content chillies, famous for deep red color and low pungency.' },
    
    // ANIMAL-BASED
    { id: 2, name: 'A2 Desi Cow Ghee', category: 'animal', sub: 'Dairy', price: 1800, unit: 'Litre', rating: 4.9, location: 'Haryana', img: 'https://i.pinimg.com/1200x/c6/ae/4b/c6ae4bf564feb7410b9a6e5ce1673244.jpg', bulk: false, desc: 'Traditional bilona method ghee from grass-fed Gir cows. Pure nutritional gold.' },
    { id: 3, name: 'Raw Himalayan Honey', category: 'animal', sub: 'Honey', price: 320, unit: 'Kg', rating: 4.7, location: 'Himachal', img: 'https://i.pinimg.com/1200x/f9/1b/74/f91b745881f4101c75c6e0172698f054.jpg', bulk: true, desc: 'Unfiltered, enzyme-rich honey harvested from wild forest blooms.' },
    { id: 201, name: 'Organic Buffalo Milk', category: 'animal', sub: 'Dairy', price: 85, unit: 'Litre', rating: 4.6, location: 'Punjab', img: 'https://i.pinimg.com/736x/83/70/f7/8370f7797b90fc938329da38ef4cd6f4.jpg', bulk: true, desc: 'Full-fat fresh buffalo milk. Direct-from-farm collection with cold chain support.' },

    // PROCESSED GOODS
    { id: 4, name: 'Cold Pressed Mustard Oil', category: 'processed', sub: 'Oils', price: 210, unit: 'Litre', rating: 4.5, location: 'Rajasthan', img: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=600', bulk: true, desc: 'Traditionally extracted yellow mustard oil with high pungency and omega-3.' },
    { id: 301, name: 'Organic Jaggery Blocks', category: 'processed', sub: 'Sweeteners', price: 85, unit: 'Kg', rating: 4.8, location: 'Gujarat', img: 'https://i.pinimg.com/1200x/2b/e7/02/2be7022cc2d314253a9efa594ced97ed.jpg', bulk: true, desc: 'Chemical-free jaggery made from fresh sugarcane juice. Rich in iron and minerals.' },
    { id: 302, name: 'Sun-dried Tomatoes', category: 'processed', sub: 'Dried Goods', price: 650, unit: 'Kg', rating: 4.4, location: 'Maharashtra', img: 'https://www.daringgourmet.com/wp-content/uploads/2019/09/Dried-Tomatoes-3-square-500x375.jpg', bulk: false, desc: 'Intense flavor preserved through natural sun-drying. No artificial preservatives.' },

    // SEEDS & PLANTING
    { id: 7, name: 'Hybrid Corn Seeds', category: 'seeds', sub: 'Certified', price: 1200, unit: '25Kg Bag', rating: 4.7, location: 'Punjab', img: 'https://i.pinimg.com/736x/79/7c/fb/797cfb95b1c8ea0f3e3d136db8326edb.jpg', bulk: false, desc: 'High-germination drought-resistant hybrid seeds for commercial cropping.' },
    { id: 401, name: 'Kesar Mango Saplings', category: 'seeds', sub: 'Saplings', price: 250, unit: 'Per Sapling', rating: 4.9, location: 'Gujarat', img: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&q=80&w=600', bulk: true, desc: 'Grafted Kesar mango plants. 2 years old, hardened and ready for transplantation.' },

    // BY-PRODUCTS
    { id: 5, name: 'Vermicompost Gold', category: 'byproducts', sub: 'Compost', price: 320, unit: '50Kg Bag', rating: 4.6, location: 'Maharashtra', img: 'https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?auto=format&fit=crop&q=80&w=600', bulk: true, desc: 'Premium worm-casted organic fertilizer for intensive high-yield farming.' },
    { id: 501, name: 'Neem Bio-Pesticide', category: 'byproducts', sub: 'Organic Inputs', price: 450, unit: '5L Can', rating: 4.7, location: 'Tamil Nadu', img: 'https://plus.unsplash.com/premium_photo-1664302148512-d5e6b063d835?auto=format&fit=crop&q=80&w=600', bulk: false, desc: 'Neem oil extract with high Azadirachtin content for natural pest control.' },
    { id: 502, name: 'Premium Wheat Straw', category: 'byproducts', sub: 'Fodder', price: 450, unit: 'Quintal', rating: 4.5, location: 'Haryana', img: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&q=80&w=600', bulk: true, desc: 'Clean, dry wheat straw bales. High fiber content, ideal for cattle feed.' },

    // MEDICINAL
    { id: 601, name: 'Ashwagandha Root', category: 'medicinal', sub: 'Herbs', price: 950, unit: 'Kg', rating: 4.9, location: 'Madhya Pradesh', img: 'https://i.pinimg.com/1200x/bc/64/d7/bc64d7ea84288f9df56e87f60f7a7c9f.jpg', bulk: true, desc: 'Dried whole roots of Withania somnifera. High withanolide content.' },
    { id: 602, name: 'Dried Tulsi Leaves', category: 'medicinal', sub: 'Herbs', price: 420, unit: 'Kg', rating: 4.8, location: 'Uttarakhand', img: 'https://cpimg.tistatic.com/06914941/b/4/Dried-Tulsi-Leaves.jpg', bulk: false, desc: 'Organic holy basil leaves, shade-dried to preserve essential oils.' },

    // FORESTRY
    { id: 6, name: 'Bamboo Construction Poles', category: 'forestry', sub: 'Timber', price: 2800, unit: '100 Poles', rating: 4.9, location: 'Assam', img: 'https://i.pinimg.com/1200x/30/a2/6a/30a26acb5e4e8d10a7d7324f7fd7aed6.jpg', bulk: true, desc: 'A-grade seasoned bamboo poles, straight and treated for durability.' },
    { id: 701, name: 'Wild Oyster Mushrooms', category: 'forestry', sub: 'Wild Produce', price: 850, unit: '500g Dried', rating: 4.7, location: 'Meghalaya', img: 'https://planetmushroom.co.in/cdn/shop/files/oyster-mushroom-1296x728-header.webp?v=1729848602', bulk: false, desc: 'Forest-harvested oyster mushrooms, naturally dried and umami-rich.' },

   
];

// --- STATE ---
let state = {
    view: 'marketplace',
    activeCategory: 'all',
    search: '',
    cart: [],
    orderHistory: JSON.parse(localStorage.getItem('kisan360_orders') || '[]')
};

// --- CORE FUNCTIONS ---
async function navigateTo(view) {
    state.view = view;
    // Scroll top
    window.scrollTo(0, 0);

    const container = document.getElementById('appContent');
    // Basic loading state could go here

    try {
        const res = await fetch(`sections/buyer_dashboard/${view}.html`);
        if (!res.ok) throw new Error('Section not found');
        const html = await res.text();
        container.innerHTML = html;
        
        // Initialize logic for the loaded section
        initSection(view);
        
        // Refresh icons
        lucide.createIcons();
        
        // Re-apply translations
        if (typeof setLanguage === 'function') {
            const currentLang = localStorage.getItem('kisan360_lang') || 'en';
            setLanguage(currentLang, true); // Suppress event to prevent infinite loop
        }
    } catch (err) {
        console.error('Navigation failed:', err);
        container.innerHTML = '<p class="p-10 text-center text-red-500">Failed to load section.</p>';
    }
}

function initSection(view) {
    switch(view) {
        case 'marketplace': initMarketplace(); break;
        case 'cart': initCart(); break;
        case 'checkout': initCheckout(); break;
        case 'confirmation': initConfirmation(); break;
        case 'history': initHistory(); break;
    }
}

// --- MARKETPLACE LOGIC ---
function initMarketplace() {
    renderCategories();
    renderMarketplaceProducts();
    
    // Search listener (Desktop)
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = state.search;
        searchInput.oninput = (e) => {
            state.search = e.target.value;
            const mobileInput = document.getElementById('mobileSearchInput');
            if (mobileInput) mobileInput.value = state.search;
            renderMarketplaceProducts();
        };
    }

    // Search listener (Mobile)
    const mobileSearchInput = document.getElementById('mobileSearchInput');
    if (mobileSearchInput) {
        mobileSearchInput.value = state.search;
        mobileSearchInput.oninput = (e) => {
            state.search = e.target.value;
            const desktopInput = document.getElementById('searchInput');
            if (desktopInput) desktopInput.value = state.search;
            renderMarketplaceProducts();
        };
    }
}

function renderCategories() {
    const list = document.getElementById('categoriesList');
    if (!list) return;

    const allBtnClass = state.activeCategory === 'all' 
        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' 
        : 'hover:bg-white text-slate-600';

    let html = `
        <button onclick="filterCategory('all')" class="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${allBtnClass}">
            <i data-lucide="layout-grid" class="w-5 h-5"></i> <span data-lang-key="buyer_all_sectors">All Sectors</span>
        </button>
    `;

    html += CATEGORIES.map(cat => {
        const activeClass = state.activeCategory === cat.id 
            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' 
            : 'hover:bg-white text-slate-600';
        return `
            <button onclick="filterCategory('${cat.id}')" class="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${activeClass}">
                <i data-lucide="${cat.icon}" class="w-5 h-5"></i> ${cat.name}
            </button>
        `;
    }).join('');

    list.innerHTML = html;
    // We need to refresh icons because we injected new ones
    lucide.createIcons();
}

function filterCategory(catId) {
    state.activeCategory = catId;
    // Re-render categories to update active state styling
    renderCategories();
    // Re-render products
    renderMarketplaceProducts();
}

function renderMarketplaceProducts() {
    const grid = document.getElementById('productsGrid');
    const title = document.getElementById('marketplaceTitle');
    const count = document.getElementById('marketplaceCount');
    
    if (!grid) return;

    // Filter
    const filtered = PRODUCTS.filter(p => {
        const matchesCat = state.activeCategory === 'all' || p.category === state.activeCategory;
        const matchesSearch = p.name.toLowerCase().includes(state.search.toLowerCase());
        return matchesCat && matchesSearch;
    });

    // Update Header
    if (title) {
        title.innerText = state.activeCategory === 'all' 
            ? 'Live Listings' 
            : (CATEGORIES.find(c => c.id === state.activeCategory)?.name || 'Products');
    }
    if (count) {
        count.innerText = `Found ${filtered.length} verified commercial lots`;
    }

    // Grid content
    grid.innerHTML = filtered.map(product => `
        <div class="product-card group bg-white rounded-[2rem] border border-slate-100 overflow-hidden hover:shadow-2xl hover:shadow-slate-200 transition-all duration-500">
            <div class="relative aspect-[16/11] overflow-hidden bg-slate-100">
                <img src="${product.img}" class="product-image w-full h-full object-cover transition-transform duration-700">
                <div class="absolute top-4 left-4 flex gap-2">
                    ${product.bulk ? `<span class="bg-orange-500 text-white text-[9px] font-black uppercase px-2 py-1 rounded-lg shadow-lg"><span data-lang-key="buyer_bulk">Bulk Lot</span></span>` : ''}
                    <span class="bg-white/90 backdrop-blur text-slate-800 text-[9px] font-bold px-2 py-1 rounded-lg shadow-sm border border-white/40 flex items-center gap-1">
                        <i data-lucide="check-circle-2" class="w-2.5 h-2.5 text-emerald-600"></i> <span data-lang-key="buyer_quality_verified">Quality Verified</span>
                    </span>
                </div>
            </div>
            <div class="p-6">
                <div class="flex justify-between items-start mb-2">
                    <div class="flex-1">
                        <p class="text-[10px] font-black text-emerald-600 uppercase tracking-[0.15em] mb-1">${product.sub}</p>
                        <h3 class="font-bold text-lg text-slate-800 leading-tight group-hover:text-emerald-700 transition-colors">${product.name}</h3>
                    </div>
                    <div class="flex items-center bg-slate-100 px-2 py-1 rounded-lg text-xs font-bold text-slate-600 ml-2">
                        <i data-lucide="star" class="w-3 h-3 text-orange-400 fill-orange-400 mr-1"></i> ${product.rating}
                    </div>
                </div>
                <div class="flex items-center text-slate-400 text-[11px] mb-4">
                    <i data-lucide="map-pin" class="w-3 h-3 mr-1"></i> ${product.location}
                </div>
                <p class="text-slate-500 text-xs line-clamp-2 mb-6">${product.desc}</p>
                <div class="flex items-center justify-between mt-auto">
                    <div>
                        <span class="text-2xl font-black text-slate-900">₹${product.price.toLocaleString()}</span>
                        <span class="text-slate-400 text-xs font-medium">/ ${product.unit}</span>
                    </div>
                    <button onclick="addToCart(${product.id})" class="group/btn bg-emerald-100 text-emerald-700 p-3 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all active:scale-95">
                        <i data-lucide="plus" class="w-6 h-6"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    lucide.createIcons();
}

// --- CART LOGIC ---
function addToCart(productId) {
    const product = PRODUCTS.find(p => p.id === productId);
    const existing = state.cart.find(item => item.id === productId);
    if (existing) {
        existing.qty++;
    } else {
        state.cart.push({ ...product, qty: 1 });
    }
    updateCartCounter();
    
    // If we are currently on the cart page, re-render it
    if (state.view === 'cart') {
        initCart();
    }
}

function removeFromCart(productId) {
    state.cart = state.cart.filter(item => item.id !== productId);
    updateCartCounter();
    if (state.view === 'cart') {
        initCart();
    }
}

function updateQty(productId, delta) {
    const item = state.cart.find(i => i.id === productId);
    if (item) {
        item.qty = Math.max(1, item.qty + delta);
        if (state.view === 'cart') {
            initCart();
        }
    }
}

function updateCartCounter() {
    const total = state.cart.reduce((acc, curr) => acc + curr.qty, 0);
    const counter = document.getElementById('cartCount');
    if (counter) {
        if (total > 0) {
            counter.innerText = total;
            counter.classList.remove('hidden');
        } else {
            counter.classList.add('hidden');
        }
    }
}

function initCart() {
    const emptyState = document.getElementById('cartEmptyState');
    const filledState = document.getElementById('cartFilledState');
    const list = document.getElementById('cartItemsList');
    const summary = document.getElementById('cartSummary');

    if (!emptyState || !filledState) return;

    if (state.cart.length === 0) {
        emptyState.classList.remove('hidden');
        filledState.classList.add('hidden');
        return;
    }

    // Show filled state
    emptyState.classList.add('hidden');
    filledState.classList.remove('hidden');

    // Render items
    if (list) {
        list.innerHTML = state.cart.map(item => `
            <div class="bg-white p-5 rounded-[2rem] border border-slate-100 flex items-center gap-6 shadow-sm">
                <img src="${item.img}" class="w-24 h-24 rounded-2xl object-cover">
                <div class="flex-1">
                    <p class="text-[10px] font-black text-emerald-600 uppercase tracking-widest">${item.sub}</p>
                    <h4 class="font-bold text-lg text-slate-800">${item.name}</h4>
                    <p class="text-emerald-600 font-bold">₹${item.price.toLocaleString()} <span class="text-slate-400 font-medium text-xs">/ ${item.unit}</span></p>
                </div>
                <div class="flex items-center bg-slate-50 rounded-2xl p-1 px-2 gap-3">
                    <button onclick="updateQty(${item.id}, -1)" class="w-8 h-8 flex items-center justify-center hover:bg-white rounded-xl transition-colors font-bold text-slate-400">-</button>
                    <span class="text-sm font-black w-6 text-center">${item.qty}</span>
                    <button onclick="updateQty(${item.id}, 1)" class="w-8 h-8 flex items-center justify-center hover:bg-white rounded-xl transition-colors font-bold text-emerald-600">+</button>
                </div>
                <button onclick="removeFromCart(${item.id})" class="p-2 text-slate-300 hover:text-red-500 transition-colors">
                    <i data-lucide="trash-2" class="w-5 h-5"></i>
                </button>
            </div>
        `).join('');
    }

    // Render summary
    if (summary) {
        const subtotal = state.cart.reduce((acc, curr) => acc + (curr.price * curr.qty), 0);
        const fee = subtotal * 0.02;
        const logistics = subtotal > 0 ? 500 : 0;
        const total = subtotal + fee + logistics;

        summary.innerHTML = `
            <div class="flex justify-between"><span>Subtotal</span><span class="text-slate-900">₹${subtotal.toLocaleString()}</span></div>
            <div class="flex justify-between"><span>Platform Fee (2%)</span><span class="text-slate-900">₹${fee.toLocaleString()}</span></div>
            <div class="flex justify-between"><span>Logistics Estimate</span><span class="text-emerald-600">₹${logistics.toLocaleString()}</span></div>
            <div class="h-px bg-slate-100 my-2"></div>
            <div class="flex justify-between text-xl font-black text-slate-900"><span><span data-lang-key="buyer_total">Total</span></span><span>₹${total.toLocaleString()}</span></div>
        `;
    }
    
    lucide.createIcons();
}

// --- CHECKOUT LOGIC ---
function initCheckout() {
    const totalEl = document.getElementById('checkoutTotal');
    if (totalEl) {
        const subtotal = state.cart.reduce((acc, curr) => acc + (curr.price * curr.qty), 0);
        const fee = subtotal * 0.02;
        const logistics = 500;
        const total = subtotal + fee + logistics;
        totalEl.innerText = '₹' + total.toLocaleString();
    }
}

function handleCheckout(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const newOrder = {
        id: 'KSN-' + Math.floor(100000 + Math.random() * 900000),
        date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        items: [...state.cart],
        subtotal: state.cart.reduce((a, b) => a + (b.price * b.qty), 0),
        total: state.cart.reduce((a, b) => a + (b.price * b.qty), 0) * 1.02 + 500,
        buyer: {
            name: `${formData.get('fname')} ${formData.get('lname')}`,
            address: formData.get('address'),
            city: formData.get('city')
        }
    };

    state.orderHistory.unshift(newOrder);
    localStorage.setItem('kisan360_orders', JSON.stringify(state.orderHistory));
    state.cart = [];
    updateCartCounter();
    navigateTo('confirmation');
}

// --- CONFIRMATION & HISTORY ---
function initConfirmation() {
    const lastOrder = state.orderHistory[0];
    if (!lastOrder) return;

    document.getElementById('confOrderId').innerText = lastOrder.id;
    document.getElementById('confOrderTotal').innerText = '₹' + Math.round(lastOrder.total).toLocaleString();
    
    const summary = document.getElementById('confOrderSummary');
    if (summary) {
        summary.innerHTML = lastOrder.items.map(i => `
            <div class="flex justify-between items-center">
                <div><p class="font-bold text-slate-800">${i.name}</p><p class="text-[10px] text-slate-500">${i.qty} × ${i.unit}</p></div>
                <span class="font-bold">₹${(i.price * i.qty).toLocaleString()}</span>
            </div>
        `).join('');
    }
}

function initHistory() {
    const empty = document.getElementById('historyEmptyState');
    const filled = document.getElementById('historyFilledState');
    const list = document.getElementById('historyList');

    if (!empty || !filled) return;

    if (state.orderHistory.length === 0) {
        empty.classList.remove('hidden');
        filled.classList.add('hidden');
        return;
    }

    empty.classList.add('hidden');
    filled.classList.remove('hidden');

    if (list) {
        list.innerHTML = state.orderHistory.map(order => `
            <div class="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm overflow-hidden relative">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <p class="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1" data-lang-key="buyer_confirmed_order_label">${translations[currentLang].buyer_confirmed_order_label}</p>
                        <h3 class="text-xl font-black text-slate-900">${order.id}</h3>
                        <p class="text-xs text-slate-500 font-medium">${order.date}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-xs text-slate-400 font-bold mb-1 uppercase tracking-tighter" data-lang-key="buyer_total_paid">${translations[currentLang].buyer_total_paid}</p>
                        <p class="text-2xl font-black text-slate-900">₹${Math.round(order.total).toLocaleString()}</p>
                    </div>
                </div>
                <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-8 border-t border-slate-50">
                    ${order.items.map(item => `
                        <div class="flex items-center gap-3">
                            <img src="${item.img}" class="w-12 h-12 rounded-xl object-cover">
                            <div>
                                <p class="text-sm font-bold text-slate-800 line-clamp-1">${item.name}</p>
                                <p class="text-[10px] text-slate-500 font-medium">${item.qty} × ${item.unit}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                    <div class="flex items-center gap-2 text-emerald-600">
                        <i data-lucide="truck" class="w-4 h-4"></i>
                        <span class="text-xs font-bold"><span data-lang-key="buyer_shipped_to">${translations[currentLang].buyer_shipped_to}</span> ${order.buyer.city}</span>
                    </div>
                    <button class="text-emerald-600 text-xs font-black uppercase tracking-widest hover:underline" data-lang-key="buyer_download_invoice">${translations[currentLang].buyer_download_invoice}</button>
                </div>
            </div>
        `).join('');
    }
    lucide.createIcons();
}


// Initialize
document.addEventListener('DOMContentLoaded', () => {
    navigateTo('marketplace');
    updateCartCounter();
    checkAuth();

    // Listen for language changes to re-render the current view
    window.addEventListener('languageChanged', (e) => {
        navigateTo(state.view);
    });
});

// --- AUTH & SYSTEM FUNCTIONS ---
function checkAuth() {
    const user = JSON.parse(localStorage.getItem('user'));
    const loginBtn = document.getElementById('loginBtn');
    const userProfile = document.getElementById('userProfile');
    const userName = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');

    if (user) {
        // Show Profile, Hide Login
        if(loginBtn) loginBtn.classList.add('hidden');
        if(userProfile) {
            userProfile.classList.remove('hidden');
            userProfile.classList.add('flex'); // Ensure flex is restored
        }
        
        if(userName) userName.innerText = user.name;
        if(userAvatar) userAvatar.innerText = user.name.charAt(0).toUpperCase();

    } else {
        // Show Login, Hide Profile
        if(loginBtn) loginBtn.classList.remove('hidden');
        if(userProfile) userProfile.classList.add('hidden');
    }
}

function logout() {
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}