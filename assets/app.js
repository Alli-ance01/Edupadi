// --- CONFIGURATION ---
// IMPORTANT: Use the base URL for your deployed backend server.
const API_BASE = "https://edupadi.onrender.com"; 
const MAX_FREE_USES = 3; // Must match the backend setting


// --- AUTHENTICATION & UI HELPERS ---

/**
 * Helper function to update the status text in the authentication container
 * on the index.html page.
 */
function setAuthStatus(message, isError = false) {
    const statusEl = document.getElementById('authStatus');
    const loaderEl = document.getElementById('authLoader');
    
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.style.color = isError ? 'var(--error)' : 'var(--primary)';
    }
    // Always hide loader when status is updated
    if (loaderEl) {
        loaderEl.style.display = 'none'; 
    }
}

/**
 * Checks for a stored token and toggles UI elements (auth form vs. dashboard).
 */
window.checkAuth = function() {
    const token = localStorage.getItem('token');
    const authContainer = document.getElementById('authContainer');
    const protectedContent = document.getElementById('protectedContent');
    const heroButtons = document.getElementById('heroButtons');
    const profileBtn = document.getElementById('profileBtn');

    if (token) {
        // Logged In State
        if (authContainer) authContainer.style.display = 'none';
        if (protectedContent) protectedContent.style.display = 'block';
        if (heroButtons) heroButtons.style.display = 'flex'; 
        if (profileBtn) profileBtn.style.display = 'block';
    } else {
        // Logged Out State
        if (authContainer) authContainer.style.display = 'block';
        if (protectedContent) protectedContent.style.display = 'none';
        if (heroButtons) heroButtons.style.display = 'none';
        if (profileBtn) profileBtn.style.display = 'none';
        setAuthStatus('Login Required'); // Reset status 
    }
};

/**
 * Handle User Logout
 */
window.doLogout = function() {
    localStorage.removeItem('token');
    window.checkAuth();
    // Redirect to home page after logout
    if (window.location.pathname !== '/index.html') {
        window.location.href = 'index.html';
    }
}


/**
 * Core Login Function
 */
window.doLogin = async function() {
    const emailEl = document.getElementById('authEmail');
    const passwordEl = document.getElementById('authPassword');
    const loaderEl = document.getElementById('authLoader');

    const email = emailEl.value.trim();
    const password = passwordEl.value.trim();

    if (!email || !password) {
        return setAuthStatus('Please enter both email and password.', true);
    }
    
    loaderEl.style.display = 'block';
    setAuthStatus('Logging in...');

    try {
        const response = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok && data.status === 'success') {
            localStorage.setItem('token', data.token);
            setAuthStatus('Login successful!');
            window.checkAuth(); 
        } else {
            setAuthStatus(data.message || 'Login failed due to an unknown error.', true);
        }
    } catch (error) {
        console.error("Login Error:", error);
        setAuthStatus('Network error. Check your connection.', true);
    } finally {
        passwordEl.value = ''; 
    }
}

/**
 * Core Register Function
 */
window.doRegister = async function() {
    const emailEl = document.getElementById('authEmail');
    const passwordEl = document.getElementById('authPassword');
    const loaderEl = document.getElementById('authLoader');

    const email = emailEl.value.trim();
    const password = passwordEl.value.trim();

    if (!email || !password) {
        return setAuthStatus('Please enter both email and password.', true);
    }
    
    loaderEl.style.display = 'block';
    setAuthStatus('Registering...');

    try {
        const response = await fetch(`${API_BASE}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok && data.status === 'success') {
            localStorage.setItem('token', data.token);
            setAuthStatus('Registration successful! Redirecting...', false);
            setTimeout(() => {
                window.checkAuth(); 
            }, 500);
        } else {
            setAuthStatus(data.message || 'Registration failed.', true);
        }
    } catch (error) {
        console.error("Register Error:", error);
        setAuthStatus('Network error. Check your connection.', true);
    } finally {
        passwordEl.value = ''; 
    }
}


// --- HOMEWORK SOLVER LOGIC (homework.html) ---

function formatAnswer(text) {
    // Basic markdown to HTML conversion for display
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\n/g, '<br>');
    return text;
}

window.solveQuestion = async function() {
    const questionText = document.getElementById('questionInput').value;
    const answerDiv = document.getElementById('solverAnswer');
    const token = localStorage.getItem('token');

    if (!token) {
        answerDiv.innerHTML = '<p style="color:var(--primary); font-weight:600;">Login to see usage</p><p>Your step-by-step solution will appear here.</p>';
        return; 
    }

    if (!questionText.trim()) {
        answerDiv.innerHTML = `<p style="color:var(--error);">Please type a question before solving.</p>`;
        return;
    }

    answerDiv.innerHTML = `<p style="color:var(--primary);">Solving...</p>`;

    try {
        const response = await fetch(`${API_BASE}/api/solve`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Critical for protection
            },
            body: JSON.stringify({ questionText })
        });

        const data = await response.json();
        
        if (response.status === 403 && data.limitReached) {
             answerDiv.innerHTML = `
                <p style="color:var(--error); font-weight:600;">Daily Limit Reached</p>
                <p>You have used your ${MAX_FREE_USES} free questions for today. Please check back tomorrow or consider upgrading to Premium for unlimited access!</p>
            `;
        } else if (response.ok) {
            const usageInfo = data.isPremium 
                ? '<span style="color:var(--primary); font-weight:600;">PREMIUM USER (Unlimited)</span>'
                : `Free uses remaining: ${MAX_FREE_USES - data.count} of ${MAX_FREE_USES}`;
                
            answerDiv.innerHTML = `
                <div style="margin-bottom: 10px; font-size: 0.9em; border-bottom: 1px solid var(--border); padding-bottom: 5px;">
                    ${usageInfo}
                </div>
                ${formatAnswer(data.answer)}
            `;
        } else {
            answerDiv.innerHTML = `<p style="color:var(--error);">Error: ${data.error || data.answer || 'Could not connect to solver.'}</p>`;
        }
    } catch (error) {
        console.error("Solver API Error:", error);
        answerDiv.innerHTML = `<p style="color:var(--error);">Network error. Try again.</p>`;
    }
}


// --- GIGS LOGIC (gigs.html) ---

function renderGigs(gigs) {
    const list = document.getElementById('gigsList');
    if (!list) return;

    list.innerHTML = ''; // Clear previous content

    if (gigs.length === 0) {
        list.innerHTML = `<div class="placeholder">No gigs yet. Create one.</div>`;
        return;
    }

    gigs.forEach(gig => {
        const gigEl = document.createElement('a');
        gigEl.className = 'card gig-item';
        // Note: In a real app, you'd link to a gig detail page here.
        gigEl.href = '#'; 
        gigEl.innerHTML = `
            <div class="card-title">${gig.title}</div>
            <div class="card-sub">${gig.desc || 'No description provided.'}</div>
            <div class="gig-price">₦${gig.price.toLocaleString()}</div>
            <div class="gig-contact">Contact: ${gig.contact}</div>
        `;
        list.appendChild(gigEl);
    });
}

window.loadGigs = async function() {
    const list = document.getElementById('gigsList');
    if (!list) return;

    list.innerHTML = `<div class="placeholder" style="color:var(--primary);">Loading gigs...</div>`;

    try {
        const response = await fetch(`${API_BASE}/api/gigs`);
        const gigs = await response.json();
        renderGigs(gigs);
    } catch (error) {
        console.error("Gigs Load Error:", error);
        list.innerHTML = `<div class="placeholder" style="color:var(--error);">Failed to load gigs.</div>`;
    }
}

window.saveGig = async function() {
    const modal = document.getElementById('gigModal');
    const title = document.getElementById('gigTitle').value;
    const desc = document.getElementById('gigDesc').value;
    const price = document.getElementById('gigPrice').value;
    const contact = document.getElementById('gigContact').value;

    if (!title || !price || !contact) {
        alert('Please fill in Title, Price, and Contact.');
        return;
    }
    
    // Simple POST request
    try {
        const response = await fetch(`${API_BASE}/api/gigs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, desc, price: Number(price), contact })
        });
        
        if (response.ok) {
            alert('Gig posted successfully!');
            modal.style.display = 'none';
            // Reload the gig list to show the new gig
            window.loadGigs(); 
        } else {
            alert('Failed to post gig.');
        }
    } catch (error) {
        console.error("Post Gig Error:", error);
        alert('Network error during gig posting.');
    }
}


// --- BUNDLES LOGIC (data.html) ---

function renderBundles(bundles, weeklyDataMB) {
    const resultsDiv = document.getElementById('bundleResults');
    if (!resultsDiv) return;

    if (bundles.length === 0) {
        resultsDiv.innerHTML = `<p>No bundles found.</p>`;
        return;
    }

    // Simple filtering logic: show bundles that meet or exceed the user's weekly need
    const recommended = bundles.filter(b => b.mb >= weeklyDataMB);
    const others = bundles.filter(b => b.mb < weeklyDataMB);

    let html = `<h4>Recommended Bundles for ${weeklyDataMB}MB/week:</h4>`;
    
    if (recommended.length === 0) {
        html += `<p style="color:var(--text-muted);">No bundles meet this requirement. Here are some alternatives:</p>`;
    } else {
        html += '<ul style="list-style: none; padding: 0;">';
        recommended.sort((a, b) => (b.mb / b.price) - (a.mb / a.price)); // Sort by MB/Price ratio (value)
        recommended.forEach(b => {
            html += `<li class="card-sub" style="padding: 8px 0; border-bottom: 1px dashed var(--border);">
                <strong>${b.provider}: ${b.name}</strong> (${b.mb}MB) - ₦${b.price}
            </li>`;
        });
        html += '</ul>';
    }

    // Display a list of all bundles for reference
    html += '<h4 style="margin-top:20px;">All Available Bundles:</h4>';
    html += '<ul style="list-style: none; padding: 0;">';
    bundles.forEach(b => {
        html += `<li class="card-sub" style="padding: 4px 0;">${b.provider}: ${b.name} (${b.mb}MB) - ₦${b.price}</li>`;
    });
    html += '</ul>';

    resultsDiv.innerHTML = html;
}

window.calculateBundles = async function() {
    const weeklyData = document.getElementById('weeklyData').value;
    const resultsDiv = document.getElementById('bundleResults');

    if (!weeklyData || isNaN(weeklyData) || Number(weeklyData) <= 0) {
        resultsDiv.innerHTML = `<p style="color:var(--error);">Please enter a valid amount of weekly data (MB).</p>`;
        return;
    }
    const weeklyDataMB = Number(weeklyData);

    resultsDiv.innerHTML = `<p style="color:var(--primary);">Fetching bundles...</p>`;

    try {
        const response = await fetch(`${API_BASE}/api/bundles`);
        const bundles = await response.json();
        renderBundles(bundles, weeklyDataMB);
    } catch (error) {
        console.error("Bundles API Error:", error);
        resultsDiv.innerHTML = `<p style="color:var(--error);">Failed to load bundle data.</p>`;
    }
}


// --- INITIALIZATION AND EVENT LISTENERS ---

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initial Auth Check (Runs on all pages)
    window.checkAuth();

    // 2. Homework Page Listeners
    const solveBtn = document.getElementById('solveQuestionBtn');
    if (solveBtn) {
        solveBtn.addEventListener('click', window.solveQuestion);
    }

    // 3. Gigs Page Listeners
    const gigsList = document.getElementById('gigsList');
    const newGigBtn = document.getElementById('newGig');
    const saveGigBtn = document.getElementById('saveGig');
    const cancelGigBtn = document.getElementById('cancelGig');
    const gigModal = document.getElementById('gigModal');

    if (gigsList) {
        window.loadGigs(); // Load gigs automatically on page load
    }
    
    if (newGigBtn) {
        newGigBtn.addEventListener('click', () => {
            if (gigModal) gigModal.style.display = 'block';
        });
    }

    if (saveGigBtn) {
        saveGigBtn.addEventListener('click', window.saveGig);
    }

    if (cancelGigBtn) {
        cancelGigBtn.addEventListener('click', () => {
            if (gigModal) gigModal.style.display = 'none';
        });
    }

    // 4. Bundles Page Listeners
    const calcBundlesBtn = document.getElementById('calcBundles');
    if (calcBundlesBtn) {
        calcBundlesBtn.addEventListener('click', window.calculateBundles);
    }
});

// Simple helper for the placeholder profile button
window.openProfile = function() {
    alert('Profile page coming soon! You are logged in.');
}

// Simple modal close for ESC key (Gigs page)
document.addEventListener('keydown', (e) => {
    const gigModal = document.getElementById('gigModal');
    if (e.key === 'Escape' && gigModal && gigModal.style.display === 'block') {
        gigModal.style.display = 'none';
    }
});
