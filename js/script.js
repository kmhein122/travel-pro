/* ===== TRAVEL PRO - MAIN JAVASCRIPT ===== */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNavbar();
  initDateTime();
  initAdminPortal();
  initAuthModal();
  initAuthSessionCheck(); // restore PHP session on page load
  initCategoryFilters();
  initSearch();
  initItineraryBuilder();
  initStarRating();
  initReviewForm();
  initContactForm();
  initSavedLocations();
  initServicesGallery();
  initItineraryHistoryPage();
  initProfilePanel();
  initToast();
});

/* ===== BACKEND PATH HELPER =====
 * Resolves the correct relative URL to the PHP backend
 * whether the current page is at the root or inside /pages/.
 */
function backendUrl(endpoint) {
  const inSubfolder = window.location.pathname.includes('/pages/');
  const base = inSubfolder ? '../backend/' : 'backend/';
  return base + endpoint;
}

/* ===== MOCK DATA ===== */
let travelPackages = [
  { id: 1, title: "Bangkok Night Market Tour", location: "Bangkok, Chatuchak", price: 2500, rating: 4.8, reviews: 342, category: "culinary", badge: "Popular", img: "bangkok_night_market.png" },
  { id: 2, title: "Chiang Mai Temple Trail", location: "Chiang Mai, Old City", price: 3200, rating: 4.9, reviews: 218, category: "culture", badge: "Top Rated", img: "chiang_mai_temple.png" },
  { id: 3, title: "Phuket Island Hopping", location: "Phuket, Phi Phi", price: 4800, rating: 4.7, reviews: 567, category: "adventure", badge: "Trending", img: "phuket_island.png" },
  { id: 4, title: "Ayutthaya Historical Day Trip", location: "Ayutthaya", price: 1800, rating: 4.6, reviews: 189, category: "culture", badge: "Best Value", img: "ayutthaya_ruins.png" },
  { id: 5, title: "Krabi Rock Climbing", location: "Krabi, Railay Beach", price: 3500, rating: 4.8, reviews: 124, category: "adventure", badge: "Adventure", img: "krabi_rock_climbing.png" },
  { id: 6, title: "Pai Mountain Retreat", location: "Pai, Mae Hong Son", price: 2900, rating: 4.9, reviews: 93, category: "relaxation", badge: "Hidden Gem", img: "pai_mountain.png" },
  { id: 7, title: "Sukhothai Heritage Walk", location: "Sukhothai", price: 2100, rating: 4.5, reviews: 76, category: "culture", badge: "Heritage", img: "sukhothai_heritage.png" },
  { id: 8, title: "Koh Samui Beach Paradise", location: "Koh Samui", price: 5200, rating: 4.7, reviews: 431, category: "relaxation", badge: "Premium", img: "koh_samui_beach.png" },
  { id: 9, title: "Bangkok Street Food Crawl", location: "Bangkok, Yaowarat", price: 1500, rating: 4.9, reviews: 892, category: "culinary", badge: "Must Try", img: "bangkok_street_food.png" },
  { id: 10, title: "Chiang Rai White Temple Tour", location: "Chiang Rai", price: 2800, rating: 4.8, reviews: 345, category: "culture", badge: "Iconic", img: "chiang_rai_temple.png" },
  { id: 11, title: "Kanchanaburi River Kwai", location: "Kanchanaburi", price: 3100, rating: 4.6, reviews: 201, category: "adventure", badge: "Historic", img: "river_kwai.png" },
  { id: 12, title: "Thai Cooking Class Secrets", location: "Bangkok, Silom", price: 2200, rating: 4.9, reviews: 567, category: "local-secrets", badge: "Local", img: "thai_cooking_class.png" },
];

const sampleItinerary = [
  { day: 1, time: "08:00 AM", title: "Visit Grand Palace", desc: "Explore the iconic Grand Palace and Wat Phra Kaew temple complex." },
  { day: 1, time: "11:00 AM", title: "Boat Tour on Chao Phraya", desc: "Cruise along the river and see temples from the water." },
  { day: 1, time: "01:00 PM", title: "Lunch at Local Market", desc: "Authentic Pad Thai and mango sticky rice at Tha Maharaj." },
  { day: 1, time: "03:00 PM", title: "Wat Arun Exploration", desc: "Cross the river to visit the Temple of Dawn." },
  { day: 2, time: "09:00 AM", title: "Chatuchak Weekend Market", desc: "Browse thousands of stalls in the world's largest weekend market." },
  { day: 2, time: "12:00 PM", title: "Jim Thompson House", desc: "Visit the beautiful traditional Thai house museum." },
  { day: 2, time: "06:00 PM", title: "Rooftop Sunset Drinks", desc: "Watch the sunset over the city skyline." },
];

let mockReviews = [
  { name: "Sarah M.", initials: "SM", rating: 5, text: "Absolutely incredible experience! The local guide knew every hidden corner of Bangkok. Worth every baht!", date: "Feb 15, 2026", verified: true },
  { name: "James T.", initials: "JT", rating: 4, text: "Great tour, very well organized. The food stops were amazing. Would recommend to anyone visiting Thailand.", date: "Feb 10, 2026", verified: true },
  { name: "Yuki K.", initials: "YK", rating: 5, text: "The best travel experience I've ever had. The team went above and beyond to make everything perfect.", date: "Feb 5, 2026", verified: false },
];

/* ===== PERSISTENT USER DATA ===== */
function getUserData() {
  return JSON.parse(localStorage.getItem('travelProUserData') || '{"bookings":[],"savedPlaces":[],"itineraries":[]}');
}
function saveUserData(data) {
  localStorage.setItem('travelProUserData', JSON.stringify(data));
}

async function loadUserHistoryFromBackend() {
  try {
    const [b, s, i] = await Promise.all([
      fetch(backendUrl('user/bookings/list.php'), { credentials: 'include' }).then(r => r.json()),
      fetch(backendUrl('user/saved/list.php'), { credentials: 'include' }).then(r => r.json()),
      fetch(backendUrl('user/itineraries/list.php'), { credentials: 'include' }).then(r => r.json()),
    ]);
    if (!b.success || !s.success || !i.success) throw new Error('history load failed');
    const data = getUserData();
    data.bookings = b.bookings || [];
    data.savedPlaces = s.savedPlaces || [];
    data.itineraries = i.itineraries || [];
    saveUserData(data);
    return data;
  } catch {
    return getUserData(); // fallback
  }
}

async function addBooking(pkg) {
  const data = getUserData();
  try {
    const r = await fetch(backendUrl('user/bookings/create.php'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ package_id: pkg.id }),
    });
    const out = await r.json();
    if (!out.success) throw new Error(out.message || 'Failed');
    await loadUserHistoryFromBackend();
    return { id: out.id, packageId: pkg.id, title: pkg.title, location: pkg.location, price: pkg.price, status: 'Confirmed', img: pkg.img };
  } catch {
    // fallback to localStorage if backend not available
    const booking = {
      id: Date.now(),
      packageId: pkg.id,
      title: pkg.title,
      location: pkg.location,
      price: pkg.price,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: 'Confirmed',
      img: pkg.img
    };
    data.bookings.unshift(booking);
    saveUserData(data);
    return booking;
  }
}

async function addSavedPlace(pkg) {
  const data = getUserData();
  if (data.savedPlaces.find(p => p.packageId === pkg.id)) return null;
  try {
    const r = await fetch(backendUrl('user/saved/add.php'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ package_id: pkg.id }),
    });
    const out = await r.json();
    if (!out.success) throw new Error(out.message || 'Failed');
    const refreshed = await loadUserHistoryFromBackend();
    return refreshed.savedPlaces.find(p => p.packageId === pkg.id) || null;
  } catch {
    const place = { id: Date.now(), packageId: pkg.id, title: pkg.title, location: pkg.location, date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), img: pkg.img };
    data.savedPlaces.unshift(place);
    saveUserData(data);
    return place;
  }
}

async function removeSavedPlace(placeId) {
  const data = getUserData();
  try {
    const r = await fetch(backendUrl('user/saved/remove.php'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ id: placeId }),
    });
    const out = await r.json();
    if (!out.success) throw new Error(out.message || 'Failed');
    await loadUserHistoryFromBackend();
    return;
  } catch {
    data.savedPlaces = data.savedPlaces.filter(p => p.id !== placeId);
    saveUserData(data);
  }
}

async function saveItinerary(dest, days, items) {
  const data = getUserData();
  try {
    const r = await fetch(backendUrl('user/itineraries/create.php'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ destination: dest, days, items }),
    });
    const out = await r.json();
    if (!out.success) throw new Error(out.message || 'Failed');
    await loadUserHistoryFromBackend();
    return { id: out.id, destination: dest, days, items };
  } catch {
    const itin = { id: Date.now(), destination: dest, days, items, date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) };
    data.itineraries.unshift(itin);
    saveUserData(data);
    return itin;
  }
}

async function removeBooking(bookingId) {
  const data = getUserData();
  try {
    const r = await fetch(backendUrl('user/bookings/cancel.php'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ id: bookingId }),
    });
    const out = await r.json();
    if (!out.success) throw new Error(out.message || 'Failed');
    await loadUserHistoryFromBackend();
  } catch {
    data.bookings = data.bookings.filter(b => b.id !== bookingId);
    saveUserData(data);
  }
}

async function removeItinerary(itinId) {
  const data = getUserData();
  try {
    const r = await fetch(backendUrl('user/itineraries/delete.php'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ id: itinId }),
    });
    const out = await r.json();
    if (!out.success) throw new Error(out.message || 'Failed');
    await loadUserHistoryFromBackend();
  } catch {
    data.itineraries = data.itineraries.filter(i => i.id !== itinId);
    saveUserData(data);
  }
}

/* ===== NAVBAR ===== */
function initNavbar() {
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');
  if (!hamburger || !navLinks) return;
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('open');
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.navbar')) {
      hamburger.classList.remove('active');
      navLinks.classList.remove('open');
    }
  });
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      navLinks.classList.remove('open');
    });
  });
  window.addEventListener('scroll', () => {
    document.querySelector('.navbar')?.classList.toggle('scrolled', window.scrollY > 50);
  });
}

/* ===== ADMIN PORTAL LINK (customer navbar) ===== */
function initAdminPortal() {
  const navActions = document.querySelector('.nav-actions');
  if (!navActions) return;
  if (document.getElementById('admin-portal-btn')) return;

  const btn = document.createElement('button');
  btn.id = 'admin-portal-btn';
  btn.className = 'btn btn-outline btn-sm';
  btn.type = 'button';
  btn.textContent = 'Admin Portal';

  btn.addEventListener('click', () => {
    const pass = prompt('Enter admin portal password:');
    if (pass === null) return;
    if (pass !== 'Admin@123') {
      showToast('Wrong admin portal password.', 'error');
      return;
    }
    const inSubfolder = window.location.pathname.includes('/pages/');
    window.location.href = inSubfolder ? '../admin/login.html' : 'admin/login.html';
  });

  navActions.appendChild(btn);
}

/* ===== DATE & TIME ===== */
function initDateTime() {
  const el = document.getElementById('nav-datetime');
  if (!el) return;
  function update() {
    const now = new Date();
    const opts = { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true };
    el.textContent = now.toLocaleDateString('en-US', opts);
  }
  update();
  setInterval(update, 30000);
}

/* ===== AUTH MODAL ===== */
// currentUser is restored either from the PHP session (via session_check)
// or falls back to localStorage so the site still partly works without a server.
let currentUser = JSON.parse(localStorage.getItem('travelProUser') || 'null');

/* ── Session restore on page load ── */
function initAuthSessionCheck() {
  fetch(backendUrl('auth/session_check.php'))
    .then(r => r.json())
    .then(data => {
      if (data.loggedIn && data.user) {
        currentUser = data.user;
        localStorage.setItem('travelProUser', JSON.stringify(currentUser));
        updateAuthUI();
      }
    })
    .catch(() => {
      // PHP server not available — fall back to localStorage silently
    });
}

function initAuthModal() {
  const overlay = document.getElementById('auth-modal');
  if (!overlay) return;
  const closeBtn = overlay.querySelector('.modal-close');
  const tabs = overlay.querySelectorAll('.auth-tab');
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const openBtns = document.querySelectorAll('[data-auth]');
  openBtns.forEach(btn => btn.addEventListener('click', (e) => { e.preventDefault(); openAuthModal(btn.dataset.auth || 'login'); }));
  closeBtn?.addEventListener('click', () => overlay.classList.remove('show'));
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('show'); });
  tabs.forEach(tab => tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const mode = tab.dataset.tab;
    if (loginForm) loginForm.style.display = mode === 'login' ? 'block' : 'none';
    if (signupForm) signupForm.style.display = mode === 'signup' ? 'block' : 'none';
  }));
  loginForm?.addEventListener('submit', handleLogin);
  signupForm?.addEventListener('submit', handleSignup);
  updateAuthUI();
}

function openAuthModal(mode = 'login') {
  const overlay = document.getElementById('auth-modal');
  if (!overlay) return;
  overlay.classList.add('show');
  overlay.querySelectorAll('.auth-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === mode));
  const lf = document.getElementById('login-form'), sf = document.getElementById('signup-form');
  if (lf) lf.style.display = mode === 'login' ? 'block' : 'none';
  if (sf) sf.style.display = mode === 'signup' ? 'block' : 'none';
}

/* ── Login ── */
function handleLogin(e) {
  e.preventDefault();
  const email = e.target.querySelector('[name="login-email"]')?.value.trim();
  const pass = e.target.querySelector('[name="login-password"]')?.value;

  if (!email || !pass) { showToast('Please fill in all fields.', 'error'); return; }
  if (!isValidEmail(email)) { showToast('Please enter a valid email.', 'error'); return; }

  const submitBtn = e.target.querySelector('[type="submit"]');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Logging in…'; }

  fetch(backendUrl('auth/login.php'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: pass }),
    credentials: 'include',  // send/receive the PHP session cookie
  })
    .then(async r => {
      const data = await r.json();
      if (data.success) {
        currentUser = data.user;
        localStorage.setItem('travelProUser', JSON.stringify(currentUser));
        document.getElementById('auth-modal')?.classList.remove('show');
        updateAuthUI();
        e.target.reset();
        showToast(`Welcome back, ${currentUser.name}! 👋`, 'success');
      } else {
        showToast(data.message || 'Login failed.', 'error');
      }
    })
    .catch(() => {
      // Fallback: allow offline / no-server usage via localStorage mock
      currentUser = { name: email.split('@')[0], email };
      localStorage.setItem('travelProUser', JSON.stringify(currentUser));
      document.getElementById('auth-modal')?.classList.remove('show');
      updateAuthUI();
      showToast(`Welcome back, ${currentUser.name}! (offline mode)`, 'success');
    })
    .finally(() => {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Login'; }
    });
}

/* ── Register ── */
function handleSignup(e) {
  e.preventDefault();
  const name = e.target.querySelector('[name="signup-name"]')?.value.trim();
  const email = e.target.querySelector('[name="signup-email"]')?.value.trim();
  const pass = e.target.querySelector('[name="signup-password"]')?.value;

  if (!name || !email || !pass) { showToast('Please fill in all fields.', 'error'); return; }
  if (!isValidEmail(email)) { showToast('Please enter a valid email.', 'error'); return; }
  if (pass.length < 6) { showToast('Password must be at least 6 characters.', 'error'); return; }

  const submitBtn = e.target.querySelector('[type="submit"]');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Creating account…'; }

  fetch(backendUrl('auth/register.php'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password: pass }),
    credentials: 'include',
  })
    .then(async r => {
      const data = await r.json();
      if (data.success) {
        currentUser = data.user;
        localStorage.setItem('travelProUser', JSON.stringify(currentUser));
        document.getElementById('auth-modal')?.classList.remove('show');
        updateAuthUI();
        e.target.reset();
        showToast(`Welcome to Travel Pro, ${currentUser.name}! 🎉`, 'success');
      } else {
        showToast(data.message || 'Registration failed.', 'error');
      }
    })
    .catch(() => {
      // Fallback: offline / no-server usage
      currentUser = { name, email };
      localStorage.setItem('travelProUser', JSON.stringify(currentUser));
      document.getElementById('auth-modal')?.classList.remove('show');
      updateAuthUI();
      showToast(`Welcome to Travel Pro, ${name}! (offline mode) 🎉`, 'success');
    })
    .finally(() => {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Create Account'; }
    });
}

/* ── Logout ── */
function handleLogout() {
  // Tell the PHP server to destroy the session
  fetch(backendUrl('auth/logout.php'), {
    method: 'POST',
    credentials: 'include',
  }).catch(() => { }); // fire-and-forget; always clear client state

  currentUser = null;
  localStorage.removeItem('travelProUser');
  updateAuthUI();
  closeProfilePanel();
  showToast('Logged out successfully.', 'info');
}
function updateAuthUI() {
  const authBtns = document.querySelectorAll('[data-auth]');
  const userMenus = document.querySelectorAll('.user-menu');
  const userNames = document.querySelectorAll('.user-name');
  if (currentUser) {
    authBtns.forEach(b => b.style.display = 'none');
    userMenus.forEach(m => m.style.display = 'flex');
    userNames.forEach(n => n.textContent = currentUser.name);
  } else {
    authBtns.forEach(b => b.style.display = '');
    userMenus.forEach(m => m.style.display = 'none');
  }
}
function requireAuth() {
  if (!currentUser) { showToast('Please log in to continue', 'info'); openAuthModal('login'); return false; }
  return true;
}

/* ===== SEARCH ===== */
function initSearch() {
  const form = document.getElementById('hero-search');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = form.querySelector('input')?.value?.trim().toLowerCase();
    if (!query) return;
    filterPackages(null, query);
    document.getElementById('packages')?.scrollIntoView({ behavior: 'smooth' });
  });
}

/* ===== CATEGORY FILTERS ===== */
function initCategoryFilters() {
  const pills = document.querySelectorAll('.pill[data-category]');
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      filterPackages(pill.dataset.category);
    });
  });
  renderPackages(travelPackages);
}
function filterPackages(category, query) {
  let filtered = [...travelPackages];
  if (category && category !== 'all') filtered = filtered.filter(p => p.category === category);
  if (query) filtered = filtered.filter(p => p.title.toLowerCase().includes(query) || p.location.toLowerCase().includes(query) || p.category.toLowerCase().includes(query));
  renderPackages(filtered);
}
function renderPackages(packages) {
  const grid = document.getElementById('packages-grid');
  if (!grid) return;
  if (packages.length === 0) { grid.innerHTML = '<div class="itinerary-placeholder"><p>No packages found. Try a different search term.</p></div>'; return; }
  const imgBase = window.location.pathname.includes('/pages/') ? '../images/' : 'images/';
  const placeholderSvg = `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="#FF6B00"/>
          <stop offset="1" stop-color="#FFB347"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="800" rx="28" fill="url(#g)"/>
      <text x="50%" y="52%" text-anchor="middle" font-family="Arial, sans-serif" font-size="84" font-weight="800" fill="rgba(255,255,255,0.92)">Travel Pro</text>
      <text x="50%" y="62%" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="rgba(255,255,255,0.75)">Package</text>
    </svg>`
  )}`;
  const savedData = getUserData();
  const savedIds = savedData.savedPlaces.map(p => p.packageId);
  grid.innerHTML = packages.map(pkg => `
    <div class="package-card" data-category="${pkg.category}">
      <div class="card-image">
        <img class="card-img-placeholder" src="${pkg.img ? (pkg.img.startsWith('http://') || pkg.img.startsWith('https://') ? pkg.img : `${imgBase}${pkg.img}`) : placeholderSvg}" alt="${pkg.title}" loading="lazy">
        ${pkg.badge ? `<span class="card-badge">${pkg.badge}</span>` : ''}
        <span class="card-save ${savedIds.includes(pkg.id) ? 'saved' : ''}" onclick="toggleSave(${pkg.id})" title="Save">${savedIds.includes(pkg.id) ? '♥' : '♡'}</span>
      </div>
      <div class="card-body">
        <div class="card-location">📍 ${pkg.location}</div>
        <div class="card-title">${pkg.title}</div>
        <div class="card-rating">
          <span class="card-stars">${'★'.repeat(Math.floor(pkg.rating))}${'☆'.repeat(5 - Math.floor(pkg.rating))}</span>
          <span>${Number(pkg.rating || 0).toFixed(1)} (${pkg.reviews ?? 0} reviews)</span>
        </div>
        <div class="card-footer">
          <div class="card-price">฿${pkg.price.toLocaleString()} <small>/person</small></div>
          <button class="btn btn-primary btn-sm" onclick="bookPackage(${pkg.id})">Book Now</button>
        </div>
      </div>
    </div>
  `).join('');
}

function toggleSave(id) {
  if (!requireAuth()) return;
  const pkg = travelPackages.find(p => p.id === id);
  if (!pkg) return;
  const data = getUserData();
  const existing = data.savedPlaces.find(p => p.packageId === id);
  if (existing) {
    removeSavedPlace(existing.id);
    showToast(`"${pkg.title}" removed from saved places`, 'info');
  } else {
    addSavedPlace(pkg);
    showToast(`"${pkg.title}" saved to your profile! ♥`, 'success');
  }
  renderPackages(travelPackages);
}

function bookPackage(id) {
  if (!requireAuth()) return;
  const pkg = travelPackages.find(p => p.id === id);
  if (!pkg) return;
  addBooking(pkg).then((booking) => {
    showToast(`✅ Booked "${pkg.title}" for ฿${pkg.price.toLocaleString()} — Booking #${booking.id}`, 'success');
  });
}

/* ===== ITINERARY BUILDER ===== */
let itineraryItems = [];
let currentItinDest = '';
let currentItinDays = 0;

function initItineraryBuilder() {
  const generateBtn = document.getElementById('generate-itinerary');
  const addBtn = document.getElementById('add-itinerary-item');
  const saveBtn = document.getElementById('save-itinerary-btn');
  if (generateBtn) generateBtn.addEventListener('click', generateItinerary);
  if (addBtn) addBtn.addEventListener('click', addItineraryItem);
  if (saveBtn) saveBtn.addEventListener('click', saveCurrentItinerary);
}

async function generateItinerary() {
  if (!requireAuth()) return;
  const dest = document.getElementById('itinerary-dest')?.value;
  const days = document.getElementById('itinerary-days')?.value;
  if (!dest || !days) { showToast('Please fill in destination and duration', 'error'); return; }

  currentItinDest = dest;
  currentItinDays = parseInt(days);

  const btn = document.getElementById('generate-itinerary');
  const origText = btn.innerHTML;
  btn.innerHTML = '<span class="ai-badge">✨ AI</span> Travel Pro AI is thinking...';
  btn.disabled = true;

  const GEMINI_API_KEY = 'AIzaSyDhFnbVd8RjakRfqQ4opgbm0nZU9cZnGz8';
  const prompt = `Create a detailed ${days}-day travel itinerary for ${dest}, Thailand.
For each activity provide a JSON array of objects with these exact keys:
- "day" (integer, 1-based day number)
- "time" (e.g. "08:00 AM")
- "title" (activity name)
- "desc" (1-2 sentence description)
Include 3-5 activities per day. Return ONLY the JSON array, no markdown fences or extra text.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      }
    );
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      itineraryItems = parsed.map((item, i) => ({
        id: Date.now() + i,
        day: item.day || 1,
        time: item.time || '12:00 PM',
        title: item.title || 'Activity',
        desc: item.desc || item.description || '',
        location: dest
      }));
      renderItinerary();
      showToast(`✨ AI generated a ${days}-day itinerary for ${dest}!`, 'success');
    } else { throw new Error('Could not parse AI response'); }
  } catch (err) {
    console.error('Gemini API Error:', err);
    showToast('AI generation failed. Using sample itinerary.', 'error');
    itineraryItems = sampleItinerary.map((item, i) => ({ ...item, id: Date.now() + i, location: dest }));
    renderItinerary();
  } finally {
    btn.innerHTML = origText;
    btn.disabled = false;
  }
}

function renderItinerary() {
  const container = document.getElementById('itinerary-timeline');
  if (!container) return;
  if (itineraryItems.length === 0) {
    container.innerHTML = '<div class="itinerary-placeholder"><p>🗺️ Your itinerary will appear here.<br>Enter a destination and duration, then click <strong>Generate</strong>!</p></div>';
    document.getElementById('save-itinerary-btn')?.classList.add('hidden');
    return;
  }
  document.getElementById('save-itinerary-btn')?.classList.remove('hidden');

  // Group items by day
  const days = {};
  itineraryItems.forEach((item, idx) => {
    const d = item.day || 1;
    if (!days[d]) days[d] = [];
    days[d].push({ ...item, _idx: idx });
  });

  let html = '';
  Object.keys(days).sort((a, b) => a - b).forEach(dayNum => {
    html += `<div class="day-group">
      <div class="day-header">
        <span class="day-badge">📅 Day ${dayNum}</span>
        <span class="day-dest">${currentItinDest || 'Thailand'}</span>
      </div>`;
    days[dayNum].forEach(item => {
      html += `
      <div class="itinerary-item" draggable="true" data-index="${item._idx}" ondragstart="dragStart(event)" ondragover="dragOver(event)" ondrop="drop(event)" ondragend="dragEnd(event)">
        <span class="drag-handle">⋮⋮</span>
        <div class="item-content">
          <div class="item-time">${item.time}</div>
          <div class="item-title" contenteditable="true" onblur="updateItineraryTitle(${item._idx}, this)">${item.title}</div>
          <div class="item-desc" contenteditable="true" onblur="updateItineraryDesc(${item._idx}, this)">${item.desc}</div>
        </div>
        <div class="item-actions">
          <button onclick="editItineraryItem(${item._idx})" title="Edit">✏️</button>
          <button class="delete" onclick="deleteItineraryItem(${item._idx})" title="Delete">🗑️</button>
        </div>
      </div>`;
    });
    html += '</div>';
  });
  container.innerHTML = html;
}

function updateItineraryTitle(index, el) { itineraryItems[index].title = el.textContent; }
function updateItineraryDesc(index, el) { itineraryItems[index].desc = el.textContent; }

function addItineraryItem() {
  if (!requireAuth()) return;
  const maxDay = itineraryItems.length > 0 ? Math.max(...itineraryItems.map(i => i.day || 1)) : 1;
  itineraryItems.push({ id: Date.now(), day: maxDay, time: "12:00 PM", title: "New Activity", desc: "Click to edit this activity.", location: currentItinDest || "Thailand" });
  renderItinerary();
  showToast('New activity added!', 'success');
}
function editItineraryItem(index) {
  const item = itineraryItems[index];
  const newTime = prompt('Enter time:', item.time);
  if (newTime !== null) { itineraryItems[index].time = newTime; renderItinerary(); }
}
function deleteItineraryItem(index) {
  itineraryItems.splice(index, 1);
  renderItinerary();
  showToast('Activity removed', 'info');
}
function saveCurrentItinerary() {
  if (!requireAuth()) return;
  if (itineraryItems.length === 0) { showToast('No itinerary to save', 'error'); return; }
  saveItinerary(currentItinDest, currentItinDays, [...itineraryItems]);
  showToast(`📋 Itinerary for ${currentItinDest} saved to your profile!`, 'success');
}

/* ===== DRAG & DROP ===== */
let dragIndex = null;
function dragStart(e) { dragIndex = +e.currentTarget.dataset.index; e.currentTarget.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; }
function dragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }
function drop(e) {
  e.preventDefault();
  const dropIndex = +e.currentTarget.dataset.index;
  if (dragIndex === null || dragIndex === dropIndex) return;
  const [moved] = itineraryItems.splice(dragIndex, 1);
  itineraryItems.splice(dropIndex, 0, moved);
  renderItinerary();
}
function dragEnd(e) { e.currentTarget.classList.remove('dragging'); dragIndex = null; }

/* ===== STAR RATING ===== */
let userRating = 0;
function initStarRating() {
  const container = document.getElementById('star-rating');
  if (!container) return;
  const stars = container.querySelectorAll('.star');
  stars.forEach((star, i) => {
    star.addEventListener('click', () => { userRating = i + 1; stars.forEach((s, j) => s.classList.toggle('active', j < userRating)); });
    star.addEventListener('mouseenter', () => { stars.forEach((s, j) => s.classList.toggle('active', j <= i)); });
    star.addEventListener('mouseleave', () => { stars.forEach((s, j) => s.classList.toggle('active', j < userRating)); });
  });
}

/* ===== REVIEW FORM ===== */
function initReviewForm() {
  const form = document.getElementById('review-form');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!requireAuth()) return;
    if (userRating === 0) { showToast('Please select a rating', 'error'); return; }
    const text = form.querySelector('textarea')?.value?.trim();
    if (!text) { showToast('Please write a review', 'error'); return; }
    try {
      const r = await fetch(backendUrl('reviews/create.php'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: userRating, text }),
        credentials: 'include',
      });
      const data = await r.json();
      if (!data.success) throw new Error(data.message || 'Failed to submit review.');
      showToast('Thank you for your review!', 'success');
      form.reset(); userRating = 0;
      document.querySelectorAll('#star-rating .star').forEach(s => s.classList.remove('active'));
      await loadReviewsFromBackend();
    } catch (err) {
      showToast(err.message || 'Failed to submit review.', 'error');
    }
  });
}
function renderReviews() {
  const container = document.getElementById('reviews-list');
  if (!container) return;
  container.innerHTML = mockReviews.map(r => `
    <div class="review-card">
      <div class="review-header">
        <div class="review-avatar">${r.initials}</div>
        <div class="review-meta">
          <h4>${r.name} ${r.verified ? '<span class="verified-badge">✓ Verified</span>' : ''}</h4>
          <span>${r.date}</span>
        </div>
      </div>
      <div class="review-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
      <div class="review-text">${r.text}</div>
      ${r.admin_reply ? `<div class="review-text" style="margin-top:10px;border-left:3px solid var(--accent);padding-left:10px;color:var(--text-medium);"><strong>Admin reply:</strong> ${r.admin_reply}</div>` : ''}
    </div>
  `).join('');
}

/* ===== CONTACT FORM VALIDATION ===== */
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let valid = true;
    const fields = [
      { name: 'name', label: 'Name', minLength: 2 },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'phone', label: 'Phone', minLength: 8 },
      { name: 'subject', label: 'Subject', minLength: 3 },
      { name: 'message', label: 'Message', minLength: 10 },
    ];
    fields.forEach(f => {
      const input = form.querySelector(`[name="${f.name}"]`);
      const error = input?.nextElementSibling;
      if (!input) return;
      input.classList.remove('error');
      if (error) error.style.display = 'none';
      const val = input.value.trim();
      if (!val) { setFieldError(input, `${f.label} is required`); valid = false; }
      else if (f.type === 'email' && !isValidEmail(val)) {
        setFieldError(input, 'Please enter a valid email');
        valid = false;
      } else if (f.minLength && val.length < f.minLength) {
        setFieldError(input, `${f.label} must be at least ${f.minLength} characters`);
        valid = false;
      }
    });
    const msgEl = form.querySelector('.form-message');
    if (valid) {
      try {
        const payload = {
          name: form.querySelector('[name="name"]')?.value?.trim(),
          email: form.querySelector('[name="email"]')?.value?.trim(),
          phone: form.querySelector('[name="phone"]')?.value?.trim(),
          subject: form.querySelector('[name="subject"]')?.value?.trim(),
          message: form.querySelector('[name="message"]')?.value?.trim(),
          date: form.querySelector('[name="date"]')?.value || '',
        };
        const r = await fetch(backendUrl('contact/create.php'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await r.json();
        if (!data.success) throw new Error(data.message || 'Failed to send message.');
        if (msgEl) { msgEl.className = 'form-message success'; msgEl.textContent = '✅ Your message has been sent!'; }
        form.reset(); showToast('Message sent successfully!', 'success');
      } catch (err) {
        if (msgEl) { msgEl.className = 'form-message error-msg'; msgEl.textContent = err.message || 'Failed to send message.'; }
        showToast(err.message || 'Failed to send message.', 'error');
      }
    } else {
      if (msgEl) { msgEl.className = 'form-message error-msg'; msgEl.textContent = '⚠️ Please fix the errors below.'; }
    }
  });
  form.querySelectorAll('.form-input').forEach(input => {
    input.addEventListener('input', () => { input.classList.remove('error'); const err = input.nextElementSibling; if (err?.classList.contains('form-error')) err.style.display = 'none'; });
  });
}
function setFieldError(input, msg) {
  input.classList.add('error');
  let error = input.nextElementSibling;
  if (error?.classList.contains('form-error')) { error.textContent = msg; error.style.display = 'block'; }
}

/* ===== SAVED LOCATIONS ===== */
function initSavedLocations() {
  const saveBtn = document.getElementById('save-location-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      if (!requireAuth()) return;
      showToast('📍 Current location saved to your profile!', 'success');
    });
  }
}

/* ===== PROFILE PANEL ===== */
function initProfilePanel() {
  // Create profile panel HTML dynamically
  if (document.getElementById('profile-panel')) return;
  const panel = document.createElement('div');
  panel.className = 'profile-overlay';
  panel.id = 'profile-panel';
  panel.innerHTML = `
    <div class="profile-drawer">
      <div class="profile-drawer-header">
        <h2>My <span class="text-orange">Profile</span></h2>
        <button class="modal-close" onclick="closeProfilePanel()">✕</button>
      </div>
      <div class="profile-user-card" id="profile-user-card"></div>
      <div class="profile-tabs" id="profile-tabs">
        <button class="profile-tab active" data-ptab="bookings">🎫 Bookings</button>
        <button class="profile-tab" data-ptab="saved">♥ Saved</button>
        <button class="profile-tab" data-ptab="itineraries">📋 Itineraries</button>
      </div>
      <div class="profile-tab-content" id="profile-tab-content"></div>
      <div class="profile-drawer-footer">
        <button class="btn btn-outline btn-sm" onclick="handleLogout()" style="width:100%;justify-content:center;">🚪 Log Out</button>
      </div>
    </div>
  `;
  document.body.appendChild(panel);
  panel.addEventListener('click', (e) => { if (e.target === panel) closeProfilePanel(); });
  panel.querySelectorAll('.profile-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      panel.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderProfileTab(tab.dataset.ptab);
    });
  });
}

function openProfilePanel() {
  if (!currentUser) { openAuthModal('login'); return; }
  const panel = document.getElementById('profile-panel');
  if (!panel) return;
  panel.classList.add('show');
  // Render user card
  const userCard = document.getElementById('profile-user-card');
  if (userCard) {
    userCard.innerHTML = `
      <div class="profile-avatar">${currentUser.name.charAt(0).toUpperCase()}</div>
      <div class="profile-info">
        <h3>${currentUser.name}</h3>
        <p>${currentUser.email}</p>
        <span class="verified-badge">✓ Verified Traveler</span>
      </div>
    `;
  }
  loadUserHistoryFromBackend().finally(() => renderProfileTab('bookings'));
}

function closeProfilePanel() {
  document.getElementById('profile-panel')?.classList.remove('show');
}

function renderProfileTab(tab) {
  const content = document.getElementById('profile-tab-content');
  if (!content) return;
  const data = getUserData();

  if (tab === 'bookings') {
    if (data.bookings.length === 0) {
      content.innerHTML = '<div class="profile-empty"><p>🎫 No bookings yet</p><small>Book a travel package to see it here!</small></div>';
      return;
    }
    content.innerHTML = `<div class="profile-stats-row">
      <div class="profile-stat"><strong>${data.bookings.length}</strong><span>Bookings</span></div>
      <div class="profile-stat"><strong>฿${data.bookings.reduce((s, b) => s + b.price, 0).toLocaleString()}</strong><span>Total Spent</span></div>
    </div>` + data.bookings.map(b => `
      <div class="profile-item">
        <div class="profile-item-icon">🎫</div>
        <div class="profile-item-info">
          <h4>${b.title}</h4>
          <p>📍 ${b.location} · 🗓 ${b.date}</p>
          <div style="display:flex;gap:8px;align-items:center;margin-top:4px;">
            <span class="booking-status">${b.status}</span>
            <span style="font-weight:700;color:var(--primary);">฿${b.price.toLocaleString()}</span>
          </div>
        </div>
        <button class="profile-item-remove" onclick="removeBookingUI(${b.id})" title="Cancel">✕</button>
      </div>
    `).join('');
  }

  if (tab === 'saved') {
    if (data.savedPlaces.length === 0) {
      content.innerHTML = '<div class="profile-empty"><p>♥ No saved places yet</p><small>Click the heart icon on any package to save it!</small></div>';
      return;
    }
    content.innerHTML = data.savedPlaces.map(p => `
      <div class="profile-item">
        <div class="profile-item-icon">📍</div>
        <div class="profile-item-info">
          <h4>${p.title}</h4>
          <p>📍 ${p.location} · Saved ${p.date}</p>
        </div>
        <button class="profile-item-remove" onclick="removeSavedPlaceUI(${p.id})" title="Remove">✕</button>
      </div>
    `).join('');
  }

  if (tab === 'itineraries') {
    if (data.itineraries.length === 0) {
      content.innerHTML = '<div class="profile-empty"><p>📋 No itineraries yet</p><small>Generate an AI itinerary and save it!</small></div>';
      return;
    }
    const inSubfolder = window.location.pathname.includes('/pages/');
    const url = inSubfolder ? 'itineraries.html' : 'pages/itineraries.html';
    content.innerHTML =
      `<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px;">
        <a class="btn btn-outline btn-sm" href="${url}" style="justify-content:center;">📋 Open Itineraries Page</a>
      </div>` +
      data.itineraries.map(it => `
      <div class="profile-item" style="cursor:pointer;" onclick="openItineraryPage(${it.id});">
        <div class="profile-item-icon">🗺️</div>
        <div class="profile-item-info">
          <h4>${it.destination} — ${it.days} Day${it.days > 1 ? 's' : ''}</h4>
          <p>📅 Created ${it.date} · ${it.items.length} activities</p>
        </div>
        <button class="profile-item-remove" onclick="event.stopPropagation(); removeItineraryUI(${it.id});" title="Delete">✕</button>
      </div>
    `).join('');
  }
}

function openItineraryPage(itineraryId) {
  const inSubfolder = window.location.pathname.includes('/pages/');
  const url = (inSubfolder ? 'itineraries.html' : 'pages/itineraries.html') + `?id=${encodeURIComponent(itineraryId)}`;
  window.location.href = url;
}

/* ===== ITINERARIES PAGE ===== */
function initItineraryHistoryPage() {
  const root = document.getElementById('itinerary-page');
  if (!root) return;
  if (!currentUser) {
    openAuthModal('login');
  }
  const params = new URLSearchParams(window.location.search);
  const selected = params.get('id') ? Number(params.get('id')) : null;
  loadUserHistoryFromBackend().finally(() => renderItineraryHistoryPage(selected));
}

function renderItineraryHistoryPage(selectedId = null) {
  const listEl = document.getElementById('itinerary-list');
  const detailEl = document.getElementById('itinerary-detail');
  if (!listEl || !detailEl) return;
  const data = getUserData();
  const itins = Array.isArray(data.itineraries) ? data.itineraries : [];

  if (itins.length === 0) {
    listEl.innerHTML = '<div class="profile-empty"><p>📋 No itineraries yet</p><small>Generate an AI itinerary and save it!</small></div>';
    detailEl.innerHTML = 'No itinerary selected.';
    return;
  }

  const activeId = selectedId ?? itins[0].id;
  listEl.innerHTML = itins.map(it => `
    <div class="profile-item" style="cursor:pointer;border:${it.id === activeId ? '1px solid rgba(255,140,0,0.45)' : '1px solid var(--border)'};" data-itin-id="${it.id}">
      <div class="profile-item-icon">📋</div>
      <div class="profile-item-info">
        <h4>${it.destination} — ${it.days} Day${it.days > 1 ? 's' : ''}</h4>
        <p>📅 ${it.date} · ${it.items.length} activities</p>
      </div>
      <button class="profile-item-remove" data-itin-del="${it.id}" title="Delete">✕</button>
    </div>
  `).join('');

  listEl.querySelectorAll('[data-itin-id]').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('[data-itin-del]')) return;
      renderItineraryHistoryPage(Number(card.dataset.itinId));
    });
  });
  listEl.querySelectorAll('[data-itin-del]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = Number(btn.dataset.itinDel);
      if (!confirm('Delete this itinerary?')) return;
      await removeItinerary(id);
      renderItineraryHistoryPage(null);
      showToast('Itinerary deleted', 'info');
    });
  });

  const current = itins.find(x => Number(x.id) === Number(activeId)) || itins[0];
  let editMode = false;
  let draft = (current.items || []).map((it, idx) => ({
    _k: String(it.id ?? `k${idx}`),
    day: Number(it.day || 1),
    time: it.time || '12:00 PM',
    title: it.title || 'Activity',
    desc: it.desc || '',
    sort_order: Number(it.sort_order ?? idx),
  }));

  const renderDetail = () => {
    const byDay = {};
    draft.forEach((item) => {
      const d = item.day || 1;
      if (!byDay[d]) byDay[d] = [];
      byDay[d].push(item);
    });
    const days = Object.keys(byDay).map(Number).sort((a, b) => a - b);

    detailEl.innerHTML = `
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;flex-wrap:wrap;">
        <div>
          <h3 style="margin:0 0 6px;font-size:1.15rem;font-weight:900;">${current.destination}</h3>
          <div style="color:var(--text-light);font-size:.9rem;">${current.days} days · Created ${current.date}</div>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          ${editMode ? `<button class="btn btn-outline btn-sm" id="itin-add-item-btn">+ Add item</button>` : ''}
          <button class="btn btn-outline btn-sm" id="itin-edit-btn" style="${editMode ? 'display:none;' : ''}">Edit</button>
          <button class="btn btn-primary btn-sm" id="itin-save-btn" style="${editMode ? '' : 'display:none;'}">Save</button>
          <button class="btn btn-outline btn-sm" id="itin-cancel-btn" style="${editMode ? '' : 'display:none;'}">Cancel</button>
        </div>
      </div>
      <style>
        @media (max-width: 720px) {
          #itinerary-detail [data-it-grid="1"] {
            grid-template-columns: 1fr 92px 132px !important;
          }
          #itinerary-detail [data-it-action="1"] {
            grid-column: 1 / -1;
          }
        }
      </style>
      <div style="margin-top:14px;display:flex;flex-direction:column;gap:12px;">
        ${(days.length ? days : [1]).map(d => `
          <div style="border:1px solid var(--border);border-radius:14px;padding:12px;background:var(--bg-light);">
            <div style="font-weight:950;margin-bottom:8px;">📅 Day ${d}</div>
            ${(byDay[d] || []).map(it => `
              <div style="padding:12px;border:1px solid var(--border);border-radius:14px;background:var(--card-bg);margin-top:10px;">
                <div data-it-grid="1" style="display:grid;grid-template-columns: 1fr 92px 132px ${editMode ? '120px' : '0px'};gap:10px;align-items:start;">
                  <div>
                    <div style="font-size:.78rem;font-weight:800;color:var(--text-light);margin-bottom:6px;">Activity</div>
                    ${editMode
                      ? `<input class="form-input" data-k="${it._k}" data-f="title" value="${String(it.title).replaceAll('"','&quot;')}" style="padding:10px;">`
                      : `<div style="font-weight:950;">${it.title}</div>`
                    }
                  </div>
                  <div>
                    <div style="font-size:.78rem;font-weight:800;color:var(--text-light);margin-bottom:6px;">Day</div>
                    ${editMode
                      ? `<input class="form-input" data-k="${it._k}" data-f="day" type="number" min="1" value="${it.day}" style="padding:10px;" />`
                      : `<div class="pill-mini">Day ${it.day}</div>`
                    }
                  </div>
                  <div>
                    <div style="font-size:.78rem;font-weight:800;color:var(--text-light);margin-bottom:6px;">Time</div>
                    ${editMode
                      ? `<input class="form-input" data-k="${it._k}" data-f="time" value="${String(it.time).replaceAll('"','&quot;')}" style="padding:10px;">`
                      : `<div class="pill-mini">${it.time}</div>`
                    }
                  </div>
                  ${editMode ? `
                    <div data-it-action="1" style="display:flex;flex-direction:column;align-items:stretch;">
                      <div style="font-size:.78rem;font-weight:800;color:var(--text-light);margin-bottom:6px;">Action</div>
                      <button class="btn btn-outline btn-sm" data-it-remove="${it._k}" title="Delete" style="justify-content:center;">Delete</button>
                    </div>
                  ` : ''}
                </div>
                <div style="margin-top:10px;">
                  <div style="font-size:.78rem;font-weight:800;color:var(--text-light);margin-bottom:6px;">Details</div>
                  ${editMode
                    ? `<textarea class="form-input" data-k="${it._k}" data-f="desc" rows="3" style="resize:vertical;">${it.desc || ''}</textarea>`
                    : (it.desc ? `<div style="color:var(--text-light);white-space:pre-wrap;">${it.desc}</div>` : `<div style="color:var(--text-light);opacity:.8;">No details.</div>`)
                  }
                </div>
              </div>
            `).join('') || (editMode ? '<div style="color:var(--text-light);">No items for this day.</div>' : '')}
          </div>
        `).join('')}
      </div>
    `;

    document.getElementById('itin-edit-btn')?.addEventListener('click', () => {
      editMode = true;
      renderDetail();
    });
    document.getElementById('itin-cancel-btn')?.addEventListener('click', () => renderItineraryHistoryPage(activeId));
    document.getElementById('itin-add-item-btn')?.addEventListener('click', () => {
      const maxDay = draft.length ? Math.max(...draft.map(x => x.day || 1)) : 1;
      const k = `new_${Date.now()}_${Math.random().toString(16).slice(2)}`;
      draft.push({ _k: k, day: maxDay, time: '12:00 PM', title: 'New Activity', desc: '', sort_order: draft.length });
      renderDetail();
      document.querySelector(`[data-k="${k}"][data-f="title"]`)?.focus();
    });
    detailEl.querySelectorAll('[data-it-remove]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const k = btn.getAttribute('data-it-remove');
        draft = draft.filter(x => x._k !== k);
        renderDetail();
      });
    });

    document.getElementById('itin-save-btn')?.addEventListener('click', async () => {
      try {
        // pull latest values from inputs
        const next = draft.map((it) => {
          const title = document.querySelector(`[data-k="${it._k}"][data-f="title"]`)?.value?.trim() || it.title;
          const time = document.querySelector(`[data-k="${it._k}"][data-f="time"]`)?.value?.trim() || it.time;
          const dayRaw = document.querySelector(`[data-k="${it._k}"][data-f="day"]`)?.value;
          const day = Math.max(1, Number(dayRaw || it.day || 1));
          const desc = document.querySelector(`[data-k="${it._k}"][data-f="desc"]`)?.value?.trim() || '';
          return { day, time, title, desc };
        }).filter(x => x.title);

        if (next.length === 0) throw new Error('Add at least 1 item before saving.');

        const r = await fetch(backendUrl('user/itineraries/update.php'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ id: current.id, destination: current.destination, days: current.days, items: next }),
        });
        const out = await r.json();
        if (!out.success) throw new Error(out.message || 'Failed to update.');
        await loadUserHistoryFromBackend();
        showToast('Itinerary updated', 'success');
        renderItineraryHistoryPage(activeId);
      } catch (e) {
        showToast(e.message || 'Update failed', 'error');
      }
    });
  };

  renderDetail();
}

function removeBookingUI(id) { removeBooking(id).finally(() => { renderProfileTab('bookings'); showToast('Booking cancelled', 'info'); }); }
function removeSavedPlaceUI(id) { removeSavedPlace(id).finally(() => { renderProfileTab('saved'); renderPackages(travelPackages); showToast('Place removed', 'info'); }); }
function removeItineraryUI(id) { removeItinerary(id).finally(() => { renderProfileTab('itineraries'); showToast('Itinerary deleted', 'info'); }); }

/* ===== TOAST NOTIFICATIONS ===== */
let toastEl = null;
let toastTimeout = null;
function initToast() { toastEl = document.createElement('div'); toastEl.className = 'toast'; document.body.appendChild(toastEl); }
function showToast(msg, type = 'info') {
  if (!toastEl) initToast();
  clearTimeout(toastTimeout);
  toastEl.textContent = msg;
  toastEl.className = `toast ${type}`;
  requestAnimationFrame(() => toastEl.classList.add('show'));
  toastTimeout = setTimeout(() => toastEl.classList.remove('show'), 3500);
}

/* ===== HELPERS ===== */
function isValidEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }

/* ===== SERVICES: EXPERIENCE GALLERY (DB-synced) ===== */
function mapPackageToGalleryCat(pkg) {
  const c = String(pkg?.category || '').toLowerCase();
  if (c.includes('adventure')) return 'adventure';
  if (c.includes('culinary') || c.includes('food')) return 'food';
  if (c.includes('relax') || c.includes('wellness') || c.includes('spa')) return 'wellness';
  return 'tours';
}

function renderServicesGallery() {
  const grid = document.getElementById('services-gallery');
  if (!grid) return;
  const imgBase = window.location.pathname.includes('/pages/') ? '../images/' : 'images/';
  if (!Array.isArray(travelPackages) || travelPackages.length === 0) {
    grid.innerHTML = '<div class="itinerary-placeholder"><p>No experiences yet. Add packages from Admin Dashboard.</p></div>';
    return;
  }
  grid.innerHTML = travelPackages.map(pkg => {
    const cat = mapPackageToGalleryCat(pkg);
    const img = pkg.img || '';
    const bg = img
      ? (img.startsWith('http://') || img.startsWith('https://') ? `url('${img}')` : `url('${imgBase}${img}')`)
      : '';
    const style = bg
      ? `background-image:${bg};background-size:cover;background-position:center;`
      : `background:linear-gradient(135deg,#FF6B00,#FFB347);`;
    return `
      <div class="service-card" data-cat="${cat}">
        <div class="service-img" style="${style}">${bg ? '' : '✈️'}</div>
        <div class="card-body">
          <h3>${pkg.title}</h3>
          <p>${pkg.location}</p>
          <div class="card-footer">
            <span class="card-price">฿${Number(pkg.price || 0).toLocaleString()} <small>/person</small></span>
            <button class="btn btn-primary btn-sm" onclick="bookPackage(${pkg.id})">Book</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function initServicesGallery() {
  const grid = document.getElementById('services-gallery');
  if (!grid) return;

  const pills = document.querySelectorAll('#gallery [data-gallery-cat]');
  pills.forEach(p => p.addEventListener('click', (e) => {
    const cat = e.currentTarget.dataset.galleryCat;
    const cards = document.querySelectorAll('#services-gallery .service-card');
    cards.forEach(card => {
      card.style.display = (cat === 'all' || card.dataset.cat === cat) ? '' : 'none';
    });
    pills.forEach(x => x.classList.remove('active'));
    e.currentTarget.classList.add('active');
  }));

  renderServicesGallery();
}

/* ===== BACKEND DATA LOADERS (optional; fallback to mock) ===== */
async function loadPackagesFromBackend() {
  try {
    const r = await fetch(backendUrl('packages/list.php'));
    const data = await r.json();
    if (data.success && Array.isArray(data.packages)) {
      travelPackages = data.packages;
      renderPackages(travelPackages);
      renderServicesGallery();
    }
  } catch { /* keep mock */ }
}

async function loadReviewsFromBackend() {
  try {
    const r = await fetch(backendUrl('reviews/list.php'));
    const data = await r.json();
    if (data.success && Array.isArray(data.reviews)) {
      mockReviews = data.reviews.map((x) => ({
        name: x.user_name || 'Traveler',
        initials: (x.user_name || 'T').split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase(),
        rating: Number(x.rating || 0),
        text: x.text || '',
        date: new Date(x.created_at || Date.now()).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }),
        verified: true,
        admin_reply: x.admin_reply || '',
      }));
      renderReviews();
    }
  } catch { /* keep mock */ }
}

/* ===== THEME ===== */
function initTheme() {
  var root = document.documentElement;
  var saved = localStorage.getItem('theme') || 'light';

  /* Inject a labelled toggle row into the mobile hamburger menu if not present */
  var navLinks = document.getElementById('nav-links');
  if (navLinks && !navLinks.querySelector('.theme-toggle-row')) {
    var row = document.createElement('div');
    row.className = 'theme-toggle-row';
    row.innerHTML =
      '<span class="theme-toggle-label"></span>' +
      '<button class="theme-toggle theme-toggle-mobile" id="theme-toggle-mobile" ' +
      'title="Toggle dark/light mode" aria-label="Toggle theme">\ud83c\udf19</button>';
    navLinks.appendChild(row);
  }

  /* Collect every toggle button on this page */
  function allBtns() { return document.querySelectorAll('.theme-toggle'); }

  function apply(theme) {
    root.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    var icon = theme === 'dark' ? '☀️' : '🌙';
    var label = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
    allBtns().forEach(function (b) { b.textContent = icon; });
    var lbl = document.querySelector('.theme-toggle-label');
    if (lbl) lbl.textContent = label;
  }

  apply(saved);

  /* Wire click on any toggle button */
  document.addEventListener('click', function (e) {
    if (e.target.closest('.theme-toggle')) {
      var current = root.getAttribute('data-theme') || 'light';
      apply(current === 'dark' ? 'light' : 'dark');
    }
  });
}

/* ===== ON PAGE LOAD ===== */
window.addEventListener('load', async () => {
  renderReviews();
  renderPackages(travelPackages);
  await loadPackagesFromBackend();
  await loadReviewsFromBackend();
  renderServicesGallery();
});
