// Shared JS for EduPadi starter
(function(){
  // basic navigation helpers
  window.openProfile = function(){ alert('Profile & settings — placeholder'); }

  // Camera + OCR logic
  const video = document.getElementById('video');
  const snapBtn = document.getElementById('snapBtn');
  const fileInput = document.getElementById('fileInput');
  const captureCanvas = document.getElementById('captureCanvas');
  const ocrTextEl = document.getElementById('ocrText');
  const processBtn = document.getElementById('processBtn');

  async function initCamera(){
    if(!video) return;
    try{
      const stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}, audio:false});
      video.srcObject = stream;
      await video.play();
    }catch(e){
      console.warn('Camera init failed', e);
      document.getElementById('cameraPreview').innerHTML = '<div class="placeholder">Camera not available — use Upload</div>';
    }
  }
  initCamera();

  function captureImage(){
    if(!video) return null;
    const w = video.videoWidth; const h = video.videoHeight;
    captureCanvas.width = w; captureCanvas.height = h;
    const ctx = captureCanvas.getContext('2d');
    ctx.drawImage(video,0,0,w,h);
    return captureCanvas.toDataURL('image/jpeg',0.9);
  }

  if(snapBtn) snapBtn.addEventListener('click', async ()=>{
    const dataUrl = captureImage();
    if(!dataUrl) return alert('Capture failed');
    localStorage.setItem('lastImage', dataUrl);
    document.getElementById('ocrText').textContent = 'Image captured — tap Run OCR';
  });

  if(fileInput) fileInput.addEventListener('change', (ev)=>{
    const f = ev.target.files[0];
    if(!f) return;
    const reader = new FileReader();
    reader.onload = ()=>{ localStorage.setItem('lastImage', reader.result); document.getElementById('ocrText').textContent = 'Image uploaded — tap Run OCR'; }
    reader.readAsDataURL(f);
  });

  if(processBtn) processBtn.addEventListener('click', async ()=>{
    const data = localStorage.getItem('lastImage');
    if(!data) return alert('No image captured or uploaded');
    ocrTextEl.textContent = 'Working...';
    try{
      const { createWorker } = Tesseract;
      const worker = createWorker({logger:m=>console.log(m)});
      await worker.load(); await worker.loadLanguage('eng'); await worker.initialize('eng');
      const res = await worker.recognize(data);
      await worker.terminate();
      const text = res.data.text.trim();
      ocrTextEl.textContent = text || 'No text found';
      // save to mock history
      const history = JSON.parse(localStorage.getItem('history')||'[]');
      history.unshift({time:Date.now(), image:data, ocr:text});
      localStorage.setItem('history', JSON.stringify(history.slice(0,30)));
      // prefill solver data
      localStorage.setItem('lastOCR', text);
    }catch(e){console.error(e); ocrTextEl.textContent = 'OCR failed — try a clearer image.'}
  });

  // Solver page behaviour
  const getAnswerBtn = document.getElementById('getAnswer');
  if(getAnswerBtn){
    document.getElementById('metaTime').textContent = new Date().toLocaleString();
    const last = localStorage.getItem('lastOCR')||'No OCR text available.';
    const aiAnswerEl = document.getElementById('aiAnswer');
    aiAnswerEl.textContent = last;

    getAnswerBtn.addEventListener('click', ()=>{
      // simulate LLM call (replace with real API server later)
      aiAnswerEl.textContent = 'Computing answer...';
      setTimeout(()=>{
        aiAnswerEl.innerHTML = '<strong>Step 1:</strong> Read the question carefully.\n\n<strong>Step 2:</strong> Apply method X.\n\n<strong>Note:</strong> This is simulated. Connect your LLM API when ready.';
        // save note
        const notes = JSON.parse(localStorage.getItem('notes')||'[]');
        notes.unshift({time:Date.now(), text:'Sample community note based on solution.'});
        localStorage.setItem('notes', JSON.stringify(notes.slice(0,20)));
        renderNotes();
      },1200);
    });
  }

  function renderNotes(){
    const list = document.getElementById('notesList');
    if(!list) return;
    const notes = JSON.parse(localStorage.getItem('notes')||'[]');
    if(notes.length===0) list.innerHTML = '<div class="placeholder">No community notes.</div>';
    else list.innerHTML = notes.map(n=>`<div class="card" style="margin-bottom:8px;padding:8px">${new Date(n.time).toLocaleString()}<div style="font-weight:700;margin-top:6px">${n.text}</div></div>`).join('');
  }
  renderNotes();

  // Bundles logic (simple static DB)
  const bundles = [
    {provider:'MTN',name:'500MB/7 days',mb:500,price:200},
    {provider:'GLO',name:'1GB/7 days',mb:1024,price:300},
    {provider:'AIRTEL',name:'250MB/7 days',mb:250,price:150},
    {provider:'9MOBILE',name:'750MB/7 days',mb:750,price:250}
  ];
  const calcBtn = document.getElementById('calcBundles');
  if(calcBtn){
    calcBtn.addEventListener('click', ()=>{
      const w = Number(document.getElementById('weeklyData').value||0);
      if(!w) return alert('Enter weekly data in MB');
      // simple recommend by price/mb
      const sorted = bundles.map(b=>({...b,score:(b.price/b.mb)})).sort((a,b)=>a.score-b.score);
      const html = sorted.map(b=>`<div class="card" style="margin-bottom:8px;padding:10px"><div style="font-weight:800">${b.provider} · ${b.name}</div><div style="color:#cbd2ff">${b.mb} MB · ₦${b.price}</div><div style="margin-top:8px"><button class="pill-btn" onclick="alert('Buy via partner link — mock')">Buy</button></div></div>`).join('');
      document.getElementById('bundleResults').innerHTML = html;
    });
  }

  // Gigs modal
  const newGigBtn = document.getElementById('newGig');
  const gigModal = document.getElementById('gigModal');
  const saveGig = document.getElementById('saveGig');
  const cancelGig = document.getElementById('cancelGig');
  function renderGigs(){
    const place = document.getElementById('gigsList');
    const gigs = JSON.parse(localStorage.getItem('gigs')||'[]');
    if(!place) return;
    if(gigs.length===0) place.innerHTML = '<div class="placeholder">No gigs yet. Create one.</div>';
    else place.innerHTML = gigs.map(g=>`<div class="card" style="margin-bottom:8px;padding:10px"><div style="font-weight:800">${escapeHtml(g.title)} · ₦${g.price}</div><div style="color:#cbd2ff;margin-top:6px">${escapeHtml(g.desc)}</div></div>`).join('');
  }
  if(newGigBtn) newGigBtn.addEventListener('click', ()=>{ gigModal.style.display='flex'; });
  if(cancelGig) cancelGig.addEventListener('click', ()=>{ gigModal.style.display='none'; });
  if(saveGig) saveGig.addEventListener('click', ()=>{
    const title = document.getElementById('gigTitle').value.trim();
    const desc = document.getElementById('gigDesc').value.trim();
    const price = Number(document.getElementById('gigPrice').value||0);
    if(!title||!desc||!price) return alert('Fill all gig fields');
    const gigs = JSON.parse(localStorage.getItem('gigs')||'[]');
    gigs.unshift({title,desc,price});
    localStorage.setItem('gigs', JSON.stringify(gigs));
    gigModal.style.display='none'; renderGigs();
  });
  renderGigs();

  // small helpers
  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }
// Modal show/hide
const modal = document.getElementById('gigModal');
document.getElementById('newGig')?.addEventListener('click',()=>modal.classList.add('show'));
document.getElementById('cancelGig')?.addEventListener('click',()=>modal.classList.remove('show'));

// Optional: button pulse on click
document.querySelectorAll('.cta, .pill-btn, .ghost-btn').forEach(btn=>{
  btn.addEventListener('mousedown',()=>btn.style.transform='scale(0.95)');
  btn.addEventListener('mouseup',()=>btn.style.transform='scale(1)');
});
})();