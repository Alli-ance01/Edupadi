// =================================================================
// 1. GLOBAL CONFIGURATION (UPDATE THIS)
// =================================================================
// IMPORTANT: Replace this with your deployed backend URL (e.g., https://your-edupadi-app.glitch.me)
const API_URL = 'https://edupadi.onrender.com'; 

// Helper function to prevent XSS attacks when rendering user content
function escapeHtml(s) {
    if (typeof s !== 'string') return s;
    return s.replace(/[&<>\"']/g, c => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[c]));
}

// =================================================================
// 2. MAIN APP LOGIC
// =================================================================
(function() {
    // --- General Helpers ---
    window.openProfile = function() { alert('Profile & settings — placeholder'); }

    // --- Camera + OCR Logic (from your original file) ---
    const video = document.getElementById('video');
    const snapBtn = document.getElementById('snapBtn');
    const fileInput = document.getElementById('fileInput');
    const captureCanvas = document.getElementById('captureCanvas');
    const ocrTextEl = document.getElementById('ocrText');
    const processBtn = document.getElementById('processBtn');
    const sendSolverBtn = document.getElementById('sendSolver');

    async function initCamera() {
        if (!video) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment'
                },
                audio: false
            });
            video.srcObject = stream;
            await video.play();
        } catch (e) {
            console.warn('Camera init failed', e);
            const previewEl = document.getElementById('cameraPreview');
            if (previewEl) previewEl.innerHTML = '<div class="placeholder">Camera not available — use Upload</div>';
        }
    }
    initCamera();

    function captureImage() {
        if (!video) return null;
        const w = video.videoWidth;
        const h = video.videoHeight;
        captureCanvas.width = w;
        captureCanvas.height = h;
        const ctx = captureCanvas.getContext('2d');
        ctx.drawImage(video, 0, 0, w, h);
        return captureCanvas.toDataURL('image/jpeg', 0.9);
    }

    if (snapBtn) snapBtn.addEventListener('click', async () => {
        const dataUrl = captureImage();
        if (!dataUrl) return alert('Capture failed');
        localStorage.setItem('lastImage', dataUrl);
        // Display the image preview instead of raw text until OCR runs
        if (ocrTextEl) ocrTextEl.innerHTML = `<img src="${dataUrl}" style="max-width:100%;height:auto;border-radius:8px;">`;
    });

    if (fileInput) fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                localStorage.setItem('lastImage', event.target.result);
                if (ocrTextEl) ocrTextEl.innerHTML = `<img src="${event.target.result}" style="max-width:100%;height:auto;border-radius:8px;">`;
            };
            reader.readAsDataURL(file);
        }
    });

    // --- Placeholder for OCR Processing (Requires an OCR API or library) ---
    if (processBtn) processBtn.addEventListener('click', () => {
        const lastImage = localStorage.getItem('lastImage');
        if (!lastImage) return alert('No image captured or uploaded.');

        // 1. Simulate OCR processing time
        if (ocrTextEl) ocrTextEl.textContent = 'Processing image... (3 sec simulation)';
        setTimeout(() => {
            // 2. Simulate the extracted text (This would be the OCR API call result)
            const simulatedText = 'Question: Calculate the value of x if 3x + 5 = 14. Show all steps.';
            localStorage.setItem('lastOCR', simulatedText);
            if (ocrTextEl) ocrTextEl.textContent = simulatedText;
            if (sendSolverBtn) sendSolverBtn.classList.add('cta');
        }, 3000);
    });

    // --- Homework Solver Logic (/solver.html) ---
    const getAnswerBtn = document.getElementById('getAnswer');
    const aiAnswerEl = document.getElementById('aiAnswer');

    if (getAnswerBtn && aiAnswerEl) {
        // Pre-fill with OCR text if available
        const ocrText = localStorage.getItem('lastOCR') || 'Type or paste your question here...';
        aiAnswerEl.textContent = ocrText;

        getAnswerBtn.addEventListener('click', async () => {
            const question = aiAnswerEl.textContent.trim();
            if (question.length < 5 || question.includes('Type or paste')) return alert("Please enter a valid question!");

            aiAnswerEl.innerHTML = '<div class="spinner">🧠 EduPadi Brain is Thinking...</div>';

            try {
                const res = await fetch(`${API_URL}/api/solve`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        questionText: question
                    })
                });

                if (!res.ok) throw new Error('Backend failed to process request.');

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

            gigsList.innerHTML = gigs.map(g => `
                <div class="card gig-card">
                    <div style="display:flex;justify-content:space-between">
                        <span style="font-weight:800;font-size:1.1em">${escapeHtml(g.title)}</span>
                        <span style="color:var(--accent);font-weight:800">₦${g.price}</span>
                    </div>
                    <div style="color:#cbd2ff;margin-top:6px;font-size:0.9em">${escapeHtml(g.desc)}</div>
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
        if(gigModal) gigModal.style.display = 'flex';
    });
    if (cancelGig) cancelGig.addEventListener('click', () => {
        if(gigModal) gigModal.style.display = 'none';
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

                if (gigModal) gigModal.style.display = 'none';
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
                    ${topBundles.map(b => `
                        <div class="card data-card">
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
            bundleResultsEl.innerHTML = `
                <p style="color:var(--primary);font-weight:bold;margin-bottom:10px;">✅ Best Recommendation for ${weeklyDataMB}MB/week:</p>
                ${suitableBundles.slice(0, 3).map(b => `
                    <div class="card data-card" style="margin-bottom:8px;border:1px solid ${b.value === suitableBundles[0].value ? 'var(--accent)' : 'var(--glass)'};">
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
