// Shared JS for EduPadi starter
(function(){
  // --- CONFIGURATION ---
  // REPLACE THIS with your actual Render/Backend URL
  const API_BASE_URL = "https://edupadi.onrender.com"; 

  // --- AUTHENTICATION STATE & HELPERS ---
  window.getToken = () => localStorage.getItem('userToken');
  window.getUserData = () => JSON.parse(localStorage.getItem('userData') || '{}');

  // THE GATEKEEPER FUNCTION
  function updateAuthUI() {
    const token = window.getToken();
    const userData = window.getUserData();

    // Get UI Elements
    const authContainer = document.getElementById('authContainer'); // Login Box
    const heroButtons = document.getElementById('heroButtons');     // Snap/Bundle Buttons
    const protectedContent = document.getElementById('protectedContent'); // Cards & Nav
    const profileBtn = document.getElementById('profileBtn');       // Header Profile
    const solverStatusEl = document.getElementById('solverStatus'); // For solver page

    if (token && userData.email) {
      // === USER IS LOGGED IN ===
      // 1. Hide Login Box
      if (authContainer) authContainer.style.display = 'none';
      
      // 2. Show Dashboard Content
      if (heroButtons) heroButtons.style.display = 'flex';
      if (protectedContent) protectedContent.style.display = 'block';
      if (profileBtn) profileBtn.style.display = 'block';

      // 3. Update Status Text (for Solver Page)
      if (solverStatusEl) {
        const type = userData.isPremium ? 'Premium' : 'Free';
        solverStatusEl.innerHTML = `🟢 <b>${type} Account</b> (${userData.email})`;
      }

    } else {
      // === USER IS LOGGED OUT ===
      // 1. Show Login Box
      if (authContainer) authContainer.style.display = 'block';
      
      // 2. Hide Dashboard Content
      if (heroButtons) heroButtons.style.display = 'none';
      if (protectedContent) protectedContent.style.display = 'none';
      if (profileBtn) profileBtn.style.display = 'none';

      // 3. Update Status Text (for Solver Page)
      if (solverStatusEl) solverStatusEl.innerHTML = '🔴 Please Log In';
    }
  }

  window.saveAuthData = (token, user) => {
    localStorage.setItem('userToken', token);
    localStorage.setItem('userData', JSON.stringify(user));
    updateAuthUI();
  };

  window.doLogout = () => {
    if(confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('userToken');
        localStorage.removeItem('userData');
        updateAuthUI();
    }
  };

  async function handleAuth(endpoint, successMessage) {
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;
    const loader = document.getElementById('authLoader');
    
    if (!email || !password) {
      alert('Please enter both email and password.');
      return;
    }

    if(loader) loader.style.display = 'block';

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();

      if (response.ok) {
        window.saveAuthData(data.token, data.data.user);
        alert(`${successMessage} successfully!`);
      } else {
        alert(`Error: ${data.message || 'Authentication failed.'}`);
      }
    } catch (error) {
      console.error(error);
      alert('Network Error. Could not connect to the backend.');
    } finally {
        if(loader) loader.style.display = 'none';
    }
  }

  window.doLogin = () => handleAuth('login', 'Logged in');
  window.doRegister = () => handleAuth('register', 'Registered');
  window.openProfile = function(){ alert('Profile Settings coming soon!'); }

  // Initialize UI on page load
  updateAuthUI();

  // --- SOLVER LOGIC (AI) ---
  const getAnswerBtn = document.getElementById('getAnswer');
  // ... (Rest of your app.js logic for solver, camera, etc. stays the same below)
  
  if(getAnswerBtn){
    const lastOCR = localStorage.getItem('lastOCR')||'No text available.';
    const aiAnswerEl = document.getElementById('aiAnswer');
    const usageEl = document.getElementById('solverUsage');
    
    aiAnswerEl.textContent = lastOCR;

    getAnswerBtn.addEventListener('click', async ()=>{
      const token = window.getToken();
      if (!token) return alert('Please log in first.');
      
      const question = document.getElementById('ocrText') ? 
                       document.getElementById('ocrText').textContent : lastOCR;

      aiAnswerEl.textContent = 'Thinking...';

      try {
        const response = await fetch(`${API_BASE_URL}/api/solve`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ questionText: question })
        });
        const data = await response.json();

        if (response.ok) {
            aiAnswerEl.textContent = data.answer;
            usageEl.textContent = `Usage: ${data.count}/${data.limit}`;
        } else if (response.status === 403) {
            aiAnswerEl.innerHTML = '<strong>Limit Reached:</strong> ' + data.error;
            usageEl.textContent = 'Limit Reached';
        } else {
            aiAnswerEl.textContent = 'Error: ' + data.message;
        }
      } catch (e) { aiAnswerEl.textContent = 'Network Error'; }
    });
  }
})();
                const data = await res.json();
                
                // Format the AI response (Convert **text** to bold and newlines to <br>)
                let formatted = data.answer.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                formatted = formatted.replace(/\n/g, '<br>');

                aiAnswerEl.innerHTML = formatted;

            } catch (err) {
                aiAnswerEl.innerHTML = '❌ Error connecting to EduPadi Brain. Check internet or API_URL.';
                console.error("AI SOLVER ERROR:", err);
            }
        });
    }

    // --- Micro Gigs Logic (/gigs.html) ---
    const gigsList = document.getElementById('gigsList');
    const gigModal = document.getElementById('gigModal');
    const newGigBtn = document.getElementById('newGig');
    const cancelGig = document.getElementById('cancelGig');
    const saveGig = document.getElementById('saveGig');

    async function loadGigs() {
        if (!gigsList) return;
        gigsList.innerHTML = '<div class="spinner">Loading Gigs...</div>';
        try {
            const res = await fetch(`${API_URL}/api/gigs`);
            const gigs = await res.json();

            if (gigs.length === 0) {
                gigsList.innerHTML = '<div class="placeholder">No gigs posted yet. Be the first!</div>';
                return;
            }
            
            // Inject animation-delay for staggered entrance
            gigsList.innerHTML = gigs.map((g, index) => `
                <div class="card gig-card" style="animation-delay: ${index * 80 + 100}ms;">
                    <div style="display:flex;justify-content:space-between">
                        <span style="font-weight:800;font-size:1.1em">${escapeHtml(g.title)}</span>
                        <span style="color:var(--accent);font-weight:800">₦${g.price}</span>
                    </div>
                    <div style="color:var(--text-muted);margin-top:6px;font-size:0.9em">${escapeHtml(g.desc)}</div>
                    ${g.contact ? `<div style="margin-top:8px;font-size:0.8em;opacity:0.7">Contact: <a href="tel:${escapeHtml(g.contact)}" style="color:var(--primary)">${escapeHtml(g.contact)}</a></div>` : ''}
                </div>
            `).join('');
        } catch (e) {
            gigsList.innerHTML = '<div class="placeholder">Offline Mode: Could not connect to load shared gigs.</div>';
            console.error("GIGS FETCH ERROR:", e);
        }
    }

    // Trigger load on startup for gigs page
    if (gigsList) loadGigs();

    if (newGigBtn) newGigBtn.addEventListener('click', () => {
        if(gigModal) gigModal.classList.add('show'); // Use class for animation
    });
    if (cancelGig) cancelGig.addEventListener('click', () => {
        if(gigModal) gigModal.classList.remove('show'); // Use class for animation
    });

    if (saveGig) {
        saveGig.addEventListener('click', async () => {
            const title = document.getElementById('gigTitle').value.trim();
            const desc = document.getElementById('gigDesc').value.trim();
            const price = Number(document.getElementById('gigPrice').value || 0);
            
            // NOTE: Add an input with id="gigContact" to your gigs.html modal!
            const contact = document.getElementById('gigContact')?.value.trim() || 'Not specified'; 

            if (!title || !price) return alert('Title and Price are required fields.');

            saveGig.textContent = 'Posting...';
            saveGig.disabled = true;

            try {
                const res = await fetch(`${API_URL}/api/gigs`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        title,
                        desc,
                        price,
                        contact
                    })
                });
                if (!res.ok) throw new Error('Failed to post gig to backend.');

                if (gigModal) gigModal.classList.remove('show');
                alert('Gig posted successfully!');
                loadGigs(); // Refresh the list
            } catch (e) {
                alert('Failed to post gig. Server error.');
                console.error("GIG POST ERROR:", e);
            } finally {
                saveGig.textContent = 'Save';
                saveGig.disabled = false;
            }
        });
    }


    // --- Data Bundles Logic (/data.html) ---
    const calcBundlesBtn = document.getElementById('calcBundles');
    const weeklyDataInput = document.getElementById('weeklyData');
    const bundleResultsEl = document.getElementById('bundleResults');

    async function fetchAndRecommendBundles() {
        if (!bundleResultsEl) return;
        bundleResultsEl.innerHTML = '<div class="spinner">Fetching latest bundle prices...</div>';

        try {
            const res = await fetch(`${API_URL}/api/bundles`);
            const allBundles = await res.json();
            
            const weeklyDataMB = Number(weeklyDataInput.value);
            
            if (weeklyDataMB <= 0) {
                // If no input, just show the best deals
                allBundles.sort((a, b) => (a.price / a.mb) - (b.price / b.mb));
                const topBundles = allBundles.slice(0, 5);

                bundleResultsEl.innerHTML = `
                    <h4>Top Value Deals:</h4>
                    ${topBundles.map((b, index) => `
                        <div class="card data-card" style="animation-delay: ${index * 80 + 100}ms;">
                            <span style="font-weight:800;color:var(--accent)">${b.provider}</span>: 
                            ${b.name} (${Math.round((b.price / b.mb) * 1000) / 1000} ₦/MB)
                        </div>
                    `).join('')}
                    <p style="opacity:0.7;margin-top:10px;">Enter your required weekly data to find the *best* option for you.</p>
                `;
                return;
            }

            // 1. Filter bundles that meet or exceed the required data
            let suitableBundles = allBundles.filter(b => b.mb >= weeklyDataMB);

            // 2. Calculate Price-per-MB and sort by best value
            suitableBundles.forEach(b => {
                b.value = b.price / b.mb;
            });
            suitableBundles.sort((a, b) => a.value - b.value); // Cheapest price per MB first

            if (suitableBundles.length === 0) {
                bundleResultsEl.innerHTML = '<div class="placeholder">No single bundle meets this high requirement. Try smaller options.</div>';
                return;
            }

            // 3. Display the recommendations
            // Inject animation-delay for staggered entrance
            bundleResultsEl.innerHTML = `
                <p style="color:var(--primary);font-weight:bold;margin-bottom:10px;">✅ Best Recommendation for ${weeklyDataMB}MB/week:</p>
                ${suitableBundles.slice(0, 3).map((b, index) => `
                    <div class="card data-card" style="margin-bottom:8px;border:1px solid ${b.value === suitableBundles[0].value ? 'var(--accent)' : 'var(--glass)'}; animation-delay: ${index * 80 + 100}ms;">
                        <div style="display:flex;justify-content:space-between">
                            <span style="font-weight:800">${b.provider} - ${b.name}</span>
                            <span style="font-weight:800;color:var(--accent)">₦${b.price}</span>
                        </div>
                        <div style="font-size:0.8em;opacity:0.8;margin-top:4px;">Value: ${Math.round((b.price / b.mb) * 1000) / 1000} ₦/MB</div>
                    </div>
                `).join('')}
            `;


        } catch (e) {
            bundleResultsEl.innerHTML = '<div class="placeholder">Error fetching bundle data. Check backend URL.</div>';
            console.error("BUNDLES FETCH ERROR:", e);
        }
    }

    if (calcBundlesBtn) calcBundlesBtn.addEventListener('click', fetchAndRecommendBundles);
    
    // Load initial recommendations on page load
    if (bundleResultsEl) fetchAndRecommendBundles(); 

})();
