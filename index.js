// ═══════════════════════════════════════════════════════
//  NOOR — Islamic Companion (Fixed Hadith API v3.2)
//  Quran: api.alquran.cloud
//  Hadith: cdn.jsdelivr.net (fawazahmed0/hadith-api) — CORS-FREE
//  Audio: mp3quran.net
// ═══════════════════════════════════════════════════════

const App = {
  currentPage: 'dashboard',
  tasbihCount: parseInt(localStorage.getItem('tasbih')) || 0,
  lastRead: JSON.parse(localStorage.getItem('lastRead')) || {surah: 1, name: 'Al-Fatiha', verses: 7},
  bookmarks: JSON.parse(localStorage.getItem('noorBookmarks')) || [],
  audioPlayer: null,
  audioPlaying: false,
  surahList: [],
  currentHadithPage: 1,
  currentHadithCollection: 'bukhari',
  currentDhikr: 'subhanallah',
  autoScrollFrame: null,
  currentAyah: 0
};

const API = {
  quran: 'https://api.alquran.cloud/v1',
  // NEW: fawazahmed0/hadith-api via jsdelivr (CORS-FREE, no auth needed)
  hadith: 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions',
  prayer: 'https://api.aladhan.com/v1'
};

const RECITERS = {
  1: { code: 'afs', name: 'Mishary Al-Afasy', server: 'server8' },
  2: { code: 'shatri', name: 'Abu Bakr Al-Shatri', server: 'server11' },
  3: { code: 'qtm', name: 'Nasser Al-Qatami', server: 'server6' },
  4: { code: 'yasser', name: 'Yasser Al-Dosari', server: 'server11' }
};

// fawazahmed0 API collections (English editions)
const HADITH_COLLECTIONS = {
  'eng-bukhari': { name: 'Sahih al-Bukhari', file: 'eng-bukhari' },
  'eng-muslim': { name: 'Sahih Muslim', file: 'eng-muslim' },
  'eng-abudawud': { name: 'Sunan Abu Dawud', file: 'eng-abudawud' },
  'eng-ibnmajah': { name: 'Sunan Ibn Majah', file: 'eng-ibnmajah' },
  'eng-tirmidhi': { name: 'Jami at-Tirmidhi', file: 'eng-tirmidhi' },
  'eng-nasai': { name: 'Sunan an-Nasai', file: 'eng-nasai' }
};

const FALLBACK_SURAHS = [
  {number: 1, englishName: 'Al-Fatiha', name: 'الفاتحة', numberOfAyahs: 7, revelationType: 'Meccan'},
  {number: 2, englishName: 'Al-Baqarah', name: 'البقرة', numberOfAyahs: 286, revelationType: 'Medinan'},
  {number: 36, englishName: 'Ya-Sin', name: 'يس', numberOfAyahs: 83, revelationType: 'Meccan'},
  {number: 55, englishName: 'Ar-Rahman', name: 'الرحمن', numberOfAyahs: 78, revelationType: 'Medinan'},
  {number: 67, englishName: 'Al-Mulk', name: 'الملك', numberOfAyahs: 30, revelationType: 'Meccan'},
  {number: 112, englishName: 'Al-Ikhlas', name: 'الإخلاص', numberOfAyahs: 4, revelationType: 'Meccan'}
];

// ═══════════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════════

function initNavigation() {
  const navBtns = document.querySelectorAll('[data-page]');
  const pages = document.querySelectorAll('.page');
  
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const pageId = btn.dataset.page;
      if (!pageId) return;
      
      pages.forEach(p => p.classList.remove('active'));
      document.getElementById(pageId)?.classList.add('active');
      
      navBtns.forEach(n => n.classList.remove('active'));
      btn.classList.add('active');
      
      App.currentPage = pageId;
      
      if (pageId === 'quran' && App.surahList.length === 0) loadSurahs();
      if (pageId === 'hadith') initHadithPage();
      if (pageId === 'prayer' && !App.prayerTimes) loadPrayerTimes();
      if (pageId === 'bookmarks') renderBookmarks();
    });
  });
}

// ═══════════════════════════════════════════════════════
// CLOCK
// ═══════════════════════════════════════════════════════

function initClock() {
  const clockEl = document.getElementById('clock');
  const gregorianEl = document.getElementById('gregorianDate');
  const hijriEl = document.getElementById('hijriDate');

  if (!clockEl) return;

  function update() {
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString('en-US', {hour12: false});
    if (gregorianEl) gregorianEl.textContent = now.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }
  update();
  setInterval(update, 1000);

  fetch(`${API.prayer}/gToH?date=${new Date().toISOString().split('T')[0]}`)
    .then(r => r.json())
    .then(data => {
      if (data.data?.hijri && hijriEl) {
        const h = data.data.hijri;
        hijriEl.textContent = `${h.day} ${h.month.en} ${h.year} AH`;
      }
    })
    .catch(() => {
      if (hijriEl) hijriEl.textContent = 'Hijri date unavailable';
    });
}

// ═══════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════

function updateDashboard() {
  const lastReadEl = document.getElementById('lastRead');
  const lastReadLabel = document.getElementById('lastReadLabel');
  const tasbihEl = document.getElementById('tasbihCount');
  const ramadanEl = document.getElementById('ramadanDays');
  const bookmarkEl = document.getElementById('bookmarkCount');

  if (tasbihEl) tasbihEl.textContent = App.tasbihCount;
  if (lastReadEl) lastReadEl.textContent = App.lastRead.name;
  if (lastReadLabel) lastReadLabel.textContent = `Surah ${App.lastRead.surah} · ${App.lastRead.verses} verses`;
  
  const ramadan2027 = new Date('2027-02-17');
  const daysUntil = Math.ceil((ramadan2027 - new Date()) / (1000 * 60 * 60 * 24));
  if (ramadanEl) ramadanEl.textContent = daysUntil > 0 ? daysUntil : 0;
  if (bookmarkEl) bookmarkEl.textContent = App.bookmarks.length;
  
  loadDailyHadith();
}

async function loadDailyHadith() {
  const previewEl = document.getElementById('dailyHadithPreview');
  const sourceEl = document.getElementById('dailyHadithSource');
  
  if (!previewEl) return;

  try {
    const collections = Object.keys(HADITH_COLLECTIONS);
    const randomCollection = collections[Math.floor(Math.random() * collections.length)];
    const res = await fetch(`${API.hadith}/${randomCollection}.json`);
    const data = await res.json();

    let hadiths = [];
    if (Array.isArray(data)) hadiths = data;
    else if (Array.isArray(data.hadiths)) hadiths = data.hadiths;
    else if (Array.isArray(data.data)) hadiths = data.data;

    if (!hadiths || hadiths.length === 0) throw new Error('Invalid hadith data');

    const idx = Math.floor(Math.random() * hadiths.length);
    const h = hadiths[idx];
    const text = h.text || h.hadith || h.hadithtext || '';
    const preview = text.length > 120 ? text.substring(0, 120) + '...' : text;
    previewEl.textContent = preview;
    if (sourceEl) sourceEl.textContent = `${HADITH_COLLECTIONS[randomCollection].name} · #${(h.hadithnumber||h.arabicnumber|| (idx+1))}`;
  } catch (err) {
    if (previewEl) previewEl.textContent = '"Actions are judged by intentions..."';
    if (sourceEl) sourceEl.textContent = 'Sahih al-Bukhari 1';
  }
}



// ═══════════════════════════════════════════════════════
// QURAN
// ═══════════════════════════════════════════════════════

async function loadSurahs() {
  const select = document.getElementById('surahSelect');
  if (!select) return;
  
  select.innerHTML = '<option value="">Loading Surahs...</option>';

  try {
    const res = await fetch(`${API.quran}/surah`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (!data.data || !Array.isArray(data.data)) throw new Error('Invalid format');

    App.surahList = data.data;
    populateSurahSelect();
  } catch (err) {
    console.warn('Quran API failed, using fallback:', err.message);
    App.surahList = FALLBACK_SURAHS;
    populateSurahSelect();
  }
}

function populateSurahSelect() {
  const select = document.getElementById('surahSelect');
  if (!select) return;
  
  select.innerHTML = '<option value="">Select a Surah...</option>';
  
  App.surahList.forEach(surah => {
    const option = document.createElement('option');
    option.value = surah.number;
    option.textContent = `${surah.number}. ${surah.englishName} (${surah.numberOfAyahs} verses)`;
    select.appendChild(option);
  });
  
  select.onchange = () => loadVerses();
}

async function loadVerses() {
  const number = document.getElementById('surahSelect')?.value;
  const edition = document.getElementById('translationSelect')?.value || 'en.sahih';
  const reciter = document.getElementById('reciterSelect')?.value || '1';
  
  if (!number) return;

  const arabicEl = document.getElementById('arabicVerses');
  const transEl = document.getElementById('verses');

  if (!arabicEl || !transEl) return;

  arabicEl.innerHTML = '<div class="loading"><div class="spinner"></div> Loading Arabic text...</div>';
  transEl.innerHTML = '<div class="loading"><div class="spinner"></div> Loading translation...</div>';

  try {
    const [arabicRes, transRes] = await Promise.all([
      fetch(`${API.quran}/surah/${number}`),
      fetch(`${API.quran}/surah/${number}/${edition}`)
    ]);

    if (!arabicRes.ok) throw new Error(`Arabic API: ${arabicRes.status}`);
    if (!transRes.ok) throw new Error(`Translation API: ${transRes.status}`);

    const arabicData = await arabicRes.json();
    const transData = await transRes.json();

    if (!arabicData.data?.ayahs || !transData.data?.ayahs) {
      throw new Error('Missing verse data');
    }

    const surah = App.surahList.find(s => s.number == number);
    App.lastRead = {
      surah: number,
      name: surah?.englishName || 'Unknown',
      verses: surah?.numberOfAyahs || arabicData.data.numberOfAyahs
    };
    localStorage.setItem('lastRead', JSON.stringify(App.lastRead));
    updateDashboard();

    arabicEl.innerHTML = `
      <div class="panel-header">
        <h4>${arabicData.data.name}</h4>
        <span class="ayah-count">${arabicData.data.numberOfAyahs} verses · ${arabicData.data.revelationType}</span>
      </div>
      ${arabicData.data.ayahs.map(v => `
        <div class="ayah" data-ayah="${v.numberInSurah}">
          <span class="ayah-number">${v.numberInSurah}</span>
          <span class="ayah-text" style="font-family:'Amiri',serif;font-size:1.5rem;">${v.text}</span>
          <button class="bookmark-mini" onclick="bookmarkAyah(${number}, ${v.numberInSurah}, '${arabicData.data.englishName.replace(/'/g, "\\'")}', '${v.text.replace(/'/g, "\\'").substring(0, 50)}...')" title="Bookmark">🔖</button>
        </div>
      `).join('')}
    `;

    transEl.innerHTML = `
      <div class="panel-header">
        <h4>${transData.data.englishName}</h4>
        <span class="ayah-count">${transData.data.numberOfAyahs} verses</span>
      </div>
      ${transData.data.ayahs.map(v => `
        <div class="ayah" data-ayah="${v.numberInSurah}">
          <span class="ayah-number">${v.numberInSurah}</span>
          ${v.text}
        </div>
      `).join('')}
    `;

    setupAudio(number, reciter);

  } catch (err) {
    arabicEl.innerHTML = `<div class="error-msg">⚠ Error loading Quran: ${err.message}</div>`;
    transEl.innerHTML = `<div class="error-msg">⚠ Translation unavailable.</div>`;
  }
}

function stopAutoScroll() {
  if (App.autoScrollFrame) {
    cancelAnimationFrame(App.autoScrollFrame);
    App.autoScrollFrame = null;
  }
}

function updateScrollToggleButton() {
  const btn = document.getElementById('toggleScrollBtn');
  if (!btn) return;
  btn.textContent = App.scrollEnabled ? 'Disable Auto-Scroll' : 'Enable Auto-Scroll';
}

function toggleScrollEnabled() {
  App.scrollEnabled = !App.scrollEnabled;
  localStorage.setItem('quranScrollEnabled', App.scrollEnabled);
  updateScrollToggleButton();
}

function startAutoScroll() {
  const arabicPanel = document.getElementById('arabicVerses');
  const transPanel = document.getElementById('verses');
  if (!arabicPanel || !transPanel || !App.audioPlayer) return;

  const ayahs = arabicPanel.querySelectorAll('.ayah');
  const ayahCount = ayahs.length;
  if (!ayahCount) return;

  function setActiveAyah(ayahNumber) {
    if (App.currentAyah === ayahNumber) return;
    App.currentAyah = ayahNumber;

    document.querySelectorAll('#arabicVerses .ayah.active, #verses .ayah.active').forEach(el => el.classList.remove('active'));
    const activeArabic = document.querySelector(`#arabicVerses .ayah[data-ayah="${ayahNumber}"]`);
    const activeTrans = document.querySelector(`#verses .ayah[data-ayah="${ayahNumber}"]`);

    if (activeArabic) activeArabic.classList.add('active');
    if (activeTrans) activeTrans.classList.add('active');

    if (App.scrollEnabled) {
      if (activeArabic) activeArabic.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (activeTrans) activeTrans.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function step() {
    if (!App.audioPlayer || App.audioPlayer.paused || !App.audioPlayer.duration) {
      stopAutoScroll();
      return;
    }

    const ratio = App.audioPlayer.currentTime / App.audioPlayer.duration;
    const ayahNumber = Math.min(ayahCount, Math.max(1, Math.ceil(ratio * ayahCount)));
    setActiveAyah(ayahNumber);
    App.autoScrollFrame = requestAnimationFrame(step);
  }

  setActiveAyah(Math.max(1, Math.ceil((App.audioPlayer.currentTime / Math.max(1, App.audioPlayer.duration)) * ayahCount)));
  stopAutoScroll();
  App.autoScrollFrame = requestAnimationFrame(step);
}

// ═══════════════════════════════════════════════════════
// AUDIO
// ═══════════════════════════════════════════════════════

function setupAudio(surahNumber, reciterId) {
  const playBtn = document.getElementById('audioPlay');
  const prevBtn = document.getElementById('audioPrev');
  const nextBtn = document.getElementById('audioNext');
  const progressEl = document.getElementById('audioProgress');
  const timeEl = document.getElementById('audioTime');
  const reciterNameEl = document.getElementById('reciterName');

  if (!playBtn) return;

  const reciter = RECITERS[reciterId] || RECITERS[1];
  const audioUrl = `https://${reciter.server}.mp3quran.net/${reciter.code}/${String(surahNumber).padStart(3, '0')}.mp3`;
  
  if (reciterNameEl) reciterNameEl.textContent = reciter.name;

  if (App.audioPlayer) {
    App.audioPlayer.pause();
    App.audioPlayer.src = '';
  }

  App.audioPlayer = new Audio();
  App.audioPlayer.preload = 'metadata';

  const toggleAudio = () => {
    if (App.audioPlaying) {
      App.audioPlayer.pause();
      App.audioPlaying = false;
      playBtn.textContent = '▶ Play';
      stopAutoScroll();
    } else {
      if (!App.audioPlayer.src) App.audioPlayer.src = audioUrl;
      App.audioPlayer.play().then(() => {
        App.audioPlaying = true;
        playBtn.textContent = '⏸ Pause';
        startAutoScroll();
      }).catch(e => {
        alert('Audio failed to play. Try a different reciter.');
      });
    }
  };

  playBtn.onclick = toggleAudio;

  App.audioPlayer.onplay = () => startAutoScroll();
  App.audioPlayer.onpause = () => stopAutoScroll();
  App.audioPlayer.onended = () => {
    App.audioPlaying = false;
    playBtn.textContent = '▶ Play';
    if (progressEl) progressEl.style.width = '0%';
    stopAutoScroll();
  };

  App.audioPlayer.ontimeupdate = () => {
    if (App.audioPlayer.duration && progressEl && timeEl) {
      const pct = (App.audioPlayer.currentTime / App.audioPlayer.duration) * 100;
      progressEl.style.width = pct + '%';
      const mins = Math.floor(App.audioPlayer.currentTime / 60);
      const secs = Math.floor(App.audioPlayer.currentTime % 60);
      timeEl.textContent = `${mins}:${String(secs).padStart(2, '0')}`;
    }
  };

  if (prevBtn) {
    prevBtn.onclick = () => {
      if (App.audioPlayer) App.audioPlayer.currentTime = Math.max(0, App.audioPlayer.currentTime - 10);
    };
  }

  if (nextBtn) {
    nextBtn.onclick = () => {
      if (App.audioPlayer) App.audioPlayer.currentTime = Math.min(App.audioPlayer.duration || 0, App.audioPlayer.currentTime + 10);
    };
  }
}

// ═══════════════════════════════════════════════════════
// BOOKMARKS
// ═══════════════════════════════════════════════════════

function bookmarkAyah(surahId, ayahId, surahName, ayahText) {
  const bookmark = {
    id: Date.now(),
    type: 'quran',
    surahId,
    ayahId,
    surahName,
    ayahText,
    date: new Date().toLocaleDateString()
  };
  App.bookmarks.push(bookmark);
  localStorage.setItem('noorBookmarks', JSON.stringify(App.bookmarks));
  updateDashboard();
  
  const btn = event.target;
  if (btn) {
    btn.style.color = 'var(--gold)';
    setTimeout(() => btn.style.color = '', 1000);
  }
}

function bookmarkHadith(hadithId, collection, header, text) {
  const bookmark = {
    id: Date.now(),
    type: 'hadith',
    hadithId,
    collection,
    header,
    text,
    date: new Date().toLocaleDateString()
  };
  App.bookmarks.push(bookmark);
  localStorage.setItem('noorBookmarks', JSON.stringify(App.bookmarks));
  updateDashboard();
  
  const btn = event.target;
  if (btn) {
    btn.textContent = '✓ Saved';
    setTimeout(() => btn.textContent = '🔖 Bookmark', 1500);
  }
}

function removeBookmark(id) {
  App.bookmarks = App.bookmarks.filter(b => b.id !== id);
  localStorage.setItem('noorBookmarks', JSON.stringify(App.bookmarks));
  renderBookmarks();
  updateDashboard();
}

function renderBookmarks() {
  const container = document.getElementById('bookmarksList');
  
  if (!container) return;

  if (App.bookmarks.length === 0) {
    container.innerHTML = '<div class="text-center" style="color:var(--white-muted);padding:40px;">No bookmarks yet.</div>';
    return;
  }

  container.innerHTML = App.bookmarks.map(b => `
    <div class="hadith-card glass" style="position:relative;">
      <button onclick="removeBookmark(${b.id})" style="position:absolute;top:12px;right:12px;background:none;box-shadow:none;padding:4px 8px;font-size:1.2rem;cursor:pointer;">🗑</button>
      <h4>${b.type === 'quran' ? `📖 ${b.surahName} ${b.ayahId}` : `📜 ${b.collection} #${b.hadithId}`}</h4>
      <p>${b.ayahText || b.text}</p>
      <div class="source">Saved on ${b.date}</div>
    </div>
  `).join('');
}

// ═══════════════════════════════════════════════════════
// HADITH — NEW CORS-FREE API (fawazahmed0 via jsdelivr)
// ═══════════════════════════════════════════════════════

function initHadithControls() {
  const select = document.getElementById('hadithCollectionSelect');
  const loadBtn = document.getElementById('loadHadithBtn');
  
  if (!select || !loadBtn) return;

  // Populate with new collection keys
  select.innerHTML = `
    <option value="eng-bukhari">Sahih al-Bukhari</option>
    <option value="eng-muslim">Sahih Muslim</option>
    <option value="eng-abudawud">Sunan Abu Dawud</option>
    <option value="eng-ibnmajah">Sunan Ibn Majah</option>
    <option value="eng-tirmidhi">Jami at-Tirmidhi</option>
    <option value="eng-nasai">Sunan an-Nasai</option>
  `;

  loadBtn.addEventListener('click', () => {
    App.currentHadithCollection = select.value;
    App.currentHadithPage = 1;
    loadHadithCollection();
  });

  const prevBtn = document.getElementById('hadithPrevPage');
  const nextBtn = document.getElementById('hadithNextPage');
  
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (App.currentHadithPage > 1) {
        App.currentHadithPage--;
        loadHadithCollection();
      }
    });
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      App.currentHadithPage++;
      loadHadithCollection();
    });
  }
}

function initHadithPage() {
  const grid = document.getElementById('hadithGrid');
  if (!grid) return;
  
  // Auto-load if empty
  if (grid.children.length <= 1) {
    loadHadithCollection();
  }
}

async function loadHadithCollection() {
  const grid = document.getElementById('hadithGrid');
  const pagination = document.getElementById('hadithPagination');
  const pageInfo = document.getElementById('hadithPageInfo');
  const collection = App.currentHadithCollection;
  
  if (!grid) return;
  
  grid.innerHTML = '<div class="loading"><div class="spinner"></div> Loading hadiths...</div>';
  if (pagination) pagination.classList.add('hidden');

  try {
    // fawazahmed0 API: loads entire collection as JSON array
    const url = `${API.hadith}/${collection}.json`;
    console.log('🌐 Fetching hadith:', url);
    
    const res = await fetch("https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@main/editions/eng-bukhari.json");
    console.log('📊 Status:', res.status);
    
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const data = await res.json();
    console.log('✅ Data received, type:', typeof data, 'isArray:', Array.isArray(data));

    // Normalize to hadiths array based on known schema variations
    let hadiths = [];
    if (Array.isArray(data)) {
      hadiths = data;
    } else if (data && Array.isArray(data.hadiths)) {
      hadiths = data.hadiths;
    } else if (data && Array.isArray(data.data)) {
      hadiths = data.data;
    } else if (data && typeof data === 'object') {
      // Try to find the first array that looks like hadith entries
      for (const k of Object.keys(data)) {
        if (Array.isArray(data[k]) && data[k].length > 0 && (data[k][0].text || data[k][0].hadith || data[k][0].hadithnumber)) {
          hadiths = data[k];
          break;
        }
      }
    }

    // Filter valid hadiths (must have text)
    hadiths = hadiths.filter(h => h && (h.text || h.hadith || h.hadithtext));

    console.log(`✅ Found ${hadiths.length} hadiths`);

    if (hadiths.length === 0) {
      grid.innerHTML = '<div class="error-msg">No hadiths found in this collection.</div>';
      return;
    }

    // Paginate: 6 per page
    const startIdx = (App.currentHadithPage - 1) * 6;
    const endIdx = startIdx + 6;
    const pageHadiths = hadiths.slice(startIdx, endIdx);
    
    if (pageHadiths.length === 0) {
      grid.innerHTML = '<div class="error-msg">No more hadiths on this page.</div>';
      return;
    }

    grid.innerHTML = pageHadiths.map((h, idx) => {
      const hadithIdx = startIdx + idx;
      const hadithId = h.hadithnumber || h.arabicnumber || (hadithIdx + 1);
      const text = h.text || h.hadith || h.hadithtext || 'No text available';
      const shortText = text.length > 350 ? text.substring(0, 350) + '...' : text;
      const narrator = h.narrator || (h.reference && h.reference.collector) || '';
      const grade = Array.isArray(h.grades) && h.grades.length ? h.grades.join(', ') : (h.grade || '');
      const safeText = shortText.replace(/"/g, '&quot;').replace(/'/g, "\'");
      const safeFull = text.replace(/"/g, '&quot;').replace(/'/g, "\'").replace(/\n/g, '\\n');

      return `
        <div class="hadith-card glass" style="position:relative;" data-full="${safeFull}" data-narrator="${(narrator+'').replace(/"/g,'&quot;')}">
          <button class="bookmark-mini" onclick='bookmarkHadith(${hadithId}, "${collection}", "Hadith #${hadithId}", "${safeText}")' title="Bookmark" style="position:absolute;top:12px;right:12px;background:none;box-shadow:none;">🔖</button>
          <h4>Hadith #${hadithId}</h4>
          ${narrator ? `<p style="font-size:0.85rem;color:var(--gold-400);margin-bottom:8px;"><strong>${narrator}</strong></p>` : ''}
          <p>${shortText}</p>
          ${grade ? `<div style="margin-top:8px;font-size:0.8rem;color:var(--emerald-400);">Grade: ${grade}</div>` : ''}
          <div class="source">${HADITH_COLLECTIONS[collection]?.name || collection}</div>
        </div>
      `;
    }).join('');

    // Attach tap/click handlers to open hadith modal (ignore taps on bookmark button)
    setTimeout(() => {
      const cards = grid.querySelectorAll('.hadith-card');
      cards.forEach(card => {
        card.addEventListener('click', (ev) => {
          if (ev.target.closest('.bookmark-mini')) return; // allow bookmarking
          const full = card.getAttribute('data-full') || '';
          const narrator = card.getAttribute('data-narrator') || '';
          openHadithModal({ title: card.querySelector('h4')?.textContent || 'Hadith', narrator, text: full });
        });
      });
    }, 30);

    // Show pagination
    if (pagination) pagination.classList.remove('hidden');
    if (pageInfo) {
      const totalPages = Math.ceil(hadiths.length / 6);
      pageInfo.textContent = `Page ${App.currentHadithPage} of ${totalPages} (${hadiths.length} hadiths)`;
    }
    if (document.getElementById('hadithPrevPage')) {
      document.getElementById('hadithPrevPage').disabled = App.currentHadithPage <= 1;
    }
    if (document.getElementById('hadithNextPage')) {
      document.getElementById('hadithNextPage').disabled = endIdx >= hadiths.length;
    }

  } catch (err) {
    console.error('❌ Hadith load error:', err);
    grid.innerHTML = `
      <div class="error-msg">
        ⚠ Failed to load hadiths: ${err.message}<br>
        <small>This API serves from GitHub CDN. If it fails, try again in a moment.</small><br>
        <button onclick="loadHadithCollection()" style="margin-top:12px;padding:8px 16px;font-size:0.85rem;">🔄 Retry</button>
      </div>
    `;
  }
}

// Hadith modal helper
function openHadithModal({ title = 'Hadith', narrator = '', text = '' } = {}) {
  let modal = document.getElementById('hadithModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'hadithModal';
    modal.className = 'hadith-modal hidden';
    modal.innerHTML = `
      <div class="modal-content glass">
        <button class="modal-close" aria-label="Close">✕</button>
        <h3 class="modal-title"></h3>
        <div class="modal-narrator"></div>
        <div class="modal-body"></div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector('.modal-close').addEventListener('click', () => modal.classList.add('hidden'));
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });
  }
  modal.classList.remove('hidden');
  modal.querySelector('.modal-title').textContent = title;
  modal.querySelector('.modal-narrator').textContent = narrator;
  const bodyEl = modal.querySelector('.modal-body');
  // decode any escaped newlines
  bodyEl.textContent = text.replace(/\\n/g, '\n');
  bodyEl.scrollTop = 0;
}

// ═══════════════════════════════════════════════════════
// PRAYER TIMES
// ═══════════════════════════════════════════════════════

async function loadPrayerTimes() {
  const grid = document.getElementById('prayerTimes');
  const locEl = document.getElementById('prayerLocation');
  const dateEl = document.getElementById('prayerDate');

  if (!grid) return;

  grid.innerHTML = '<div class="loading"><div class="spinner"></div> Locating you...</div>';

  const prayerOrder = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

  function renderPrayerTimes(times, locationName, hijriDate) {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    let nextPrayer = null;
    let minDiff = Infinity;

    const fardPrayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    for (const name of fardPrayers) {
      const [h, m] = times[name].split(':').map(Number);
      const prayerMinutes = h * 60 + m;
      const diff = prayerMinutes - currentMinutes;
      if (diff > 0 && diff < minDiff) {
        minDiff = diff;
        nextPrayer = name;
      }
    }

    const nextPrayerEl = document.getElementById('nextPrayer');
    const nextPrayerNameEl = document.getElementById('nextPrayerName');
    
    if (nextPrayer) {
      if (nextPrayerEl) nextPrayerEl.textContent = times[nextPrayer];
      if (nextPrayerNameEl) nextPrayerNameEl.textContent = `${nextPrayer} in ${Math.ceil(minDiff)} min`;
    } else {
      if (nextPrayerEl) nextPrayerEl.textContent = times.Fajr;
      if (nextPrayerNameEl) nextPrayerNameEl.textContent = 'Fajr tomorrow';
    }

    grid.innerHTML = prayerOrder.map(name => {
      const [h, m] = times[name].split(':').map(Number);
      const prayerMinutes = h * 60 + m;
      const isActive = name === nextPrayer;
      const isPast = prayerMinutes < currentMinutes && name !== 'Sunrise';

      return `
        <div class="prayer-card ${isActive ? 'active' : ''} ${isPast ? 'past' : ''}">
          <div class="prayer-name">${name}</div>
          <div class="prayer-time">${times[name]}</div>
          ${isActive ? '<div class="prayer-status">● Up Next</div>' : ''}
          ${isPast && !isActive ? '<div class="prayer-status" style="color:var(--white-muted);">✓ Completed</div>' : ''}
        </div>
      `;
    }).join('');

    if (locEl) locEl.innerHTML = `📍 ${locationName || 'Your Location'}`;
    if (hijriDate && dateEl) {
      dateEl.textContent = `${hijriDate.day} ${hijriDate.month.en} ${hijriDate.year} AH · ${new Date().toLocaleDateString('en-US', {weekday:'long', month:'long', day:'numeric', year:'numeric'})}`;
    }
  }

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await fetch(`${API.prayer}/timings?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&method=2`);
          const data = await res.json();
          if (data.data?.timings) renderPrayerTimes(data.data.timings, 'Your Location', data.data.date?.hijri);
        } catch (err) {
          fallbackPrayerTimes();
        }
      },
      () => fallbackPrayerTimes(),
      {timeout: 10000}
    );
  } else {
    fallbackPrayerTimes();
  }

  async function fallbackPrayerTimes() {
    try {
      const res = await fetch(`${API.prayer}/timings?latitude=21.4225&longitude=39.8262&method=4`);
      const data = await res.json();
      if (data.data?.timings) renderPrayerTimes(data.data.timings, 'Makkah (Default)', data.data.date?.hijri);
    } catch (err) {
      if (grid) grid.innerHTML = `<div class="error-msg">⚠ Unable to load prayer times.</div>`;
    }
  }
}

// ═══════════════════════════════════════════════════════
// TASBIH
// ═══════════════════════════════════════════════════════

function initTasbih() {
  const counter = document.getElementById('counter');
  const btn = document.getElementById('tasbihBtn');
  const progress = document.getElementById('tasbihProgress');
  const cycleInfo = document.getElementById('cycleInfo');
  const totalInfo = document.getElementById('totalInfo');
  const dhikrSelect = document.getElementById('dhikrSelect');

  if (!btn) return;

  const dhikrLimits = {
    subhanallah: 33,
    alhamdulillah: 33,
    allahuakbar: 33,
    lailaha: 100,
    astaghfirullah: 100,
    salawaat: 100
  };

  function updateDisplay() {
    if (counter) counter.textContent = App.tasbihCount;
    const limit = dhikrLimits[App.currentDhikr] || 33;
    const cycle = App.tasbihCount % limit;
    const cycles = Math.floor(App.tasbihCount / limit);
    if (progress) progress.style.width = `${(cycle / limit) * 100}%`;
    if (cycleInfo) cycleInfo.textContent = `Cycle: ${cycle}/${limit}`;
    if (totalInfo) totalInfo.textContent = `Total: ${App.tasbihCount} · ${cycles} complete`;
  }

  updateDisplay();

  if (dhikrSelect) {
    dhikrSelect.addEventListener('change', (e) => {
      App.currentDhikr = e.target.value;
      updateDisplay();
    });
  }

  btn.addEventListener('click', () => {
    App.tasbihCount++;
    localStorage.setItem('tasbih', App.tasbihCount);
    updateDisplay();
    updateDashboard();
    
    btn.classList.add('pulse');
    setTimeout(() => btn.classList.remove('pulse'), 600);
    
    if (navigator.vibrate) navigator.vibrate(15);
  });

  const resetBtn = document.getElementById('resetTasbih');
  const clearBtn = document.getElementById('clearAllTasbih');
  
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      App.tasbihCount = 0;
      localStorage.setItem('tasbih', 0);
      updateDisplay();
      updateDashboard();
    });
  }
  
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('Clear all tasbih history?')) {
        App.tasbihCount = 0;
        localStorage.setItem('tasbih', 0);
        updateDisplay();
        updateDashboard();
      }
    });
  }
}

// ═══════════════════════════════════════════════════════
// CHATBOT
// ═══════════════════════════════════════════════════════

function initChatbot() {
  const chatWindow = document.getElementById('chatWindow');
  const input = document.getElementById('botInput');
  const askBtn = document.getElementById('askBtn');

  if (!chatWindow || !input || !askBtn) return;

  const knowledgeBase = {
    wudu: {
      keywords: ['wudu', 'ablution', 'wash', 'clean', 'wudhu'],
      response: `**How to Perform Wudu:**

1. **Niyyah** — Make the intention in your heart
2. **Wash hands** — Three times up to the wrists
3. **Rinse mouth** — Three times
4. **Cleanse nose** — Three times
5. **Wash face** — Three times, from hairline to chin
6. **Wash arms** — Right then left, up to elbows, three times
7. **Wipe head** — Once, from front to back
8. **Wipe ears** — Once, inside and behind
9. **Wash feet** — Right then left, up to ankles, three times`
    },
    pillars: {
      keywords: ['pillars', 'arkan', 'five', 'islam', 'foundation'],
      response: `**The Five Pillars of Islam:**

1. **Shahadah** — Declaration of faith
2. **Salah** — Praying five times daily
3. **Zakah** — Giving charity to the poor
4. **Sawm** — Fasting in Ramadan
5. **Hajj** — Pilgrimage to Makkah (if able)`
    },
    prayer: {
      keywords: ['prayer', 'salah', 'namaz', 'sujood', 'rakah'],
      response: `**Daily Prayers (Salah):**

• **Fajr** — 2 rak'ahs (dawn)
• **Dhuhr** — 4 rak'ahs (noon)
• **Asr** — 4 rak'ahs (afternoon)
• **Maghrib** — 3 rak'ahs (sunset)
• **Isha** — 4 rak'ahs (night)`
    },
    fasting: {
      keywords: ['fast', 'ramadan', 'sawm', 'roza', 'fasting'],
      response: `**Fasting (Sawm) in Ramadan:**

• Abstain from food, drink, and marital relations from dawn to sunset
• Make intention (niyyah) before dawn each day
• Break fast with dates and water (Sunnah)
• Exemptions: illness, travel, pregnancy, old age

*"O you who believe! Fasting is prescribed for you..."* (2:183)`
    },
    zakat: {
      keywords: ['zakat', 'charity', 'sadaqah', 'donate', 'poor'],
      response: `**Zakat (Obligatory Charity):**

• **Rate:** 2.5% of savings held for one lunar year
• **Nisab:** Minimum threshold (~$400-500 USD)
• **Recipients:** 8 categories including the poor, needy, debtors

*"The example of those who spend their wealth in the way of Allah is like a seed which grows seven spikes"* (2:261)`
    },
    hajj: {
      keywords: ['hajj', 'umrah', 'pilgrimage', 'makkah', 'kaaba'],
      response: `**Hajj & Umrah:**

**Hajj** (Major Pilgrimage):
• Performed in Dhul-Hijjah (12th month)
• Obligatory once in a lifetime if able
• Rituals: Ihram, Tawaf, Sa'i, Arafat, Rami, Qurbani

**Umrah** (Minor Pilgrimage):
• Can be performed anytime
• Rituals: Ihram, Tawaf, Sa'i, Halq/Taqsir`
    },
    greeting: {
      keywords: ['hello', 'hi', 'hey', 'assalam', 'salaam', 'salam'],
      response: `**Wa Alaikum Assalam wa Rahmatullahi wa Barakatuh!**

Peace, mercy, and blessings of Allah be upon you too. How may I assist you today?`
    }
  };

  function addMessage(text, isUser = false) {
    const msg = document.createElement('div');
    msg.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    msg.innerHTML = text.replace(/\n/g, '<br>');
    chatWindow.appendChild(msg);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  function getResponse(query) {
    const q = query.toLowerCase();
    for (const key in knowledgeBase) {
      if (knowledgeBase[key].keywords.some(k => q.includes(k))) {
        return knowledgeBase[key].response;
      }
    }
    return `I'm not sure about that. I can help with:

• **Wudu** (ablution)
• **Five Pillars** of Islam
• **Prayer** (Salah)
• **Fasting** (Ramadan)
• **Zakat** (charity)
• **Hajj** and Umrah

Please ask about one of these.`;
  }

  function handleAsk() {
    const query = input.value.trim();
    if (!query) return;
    addMessage(query, true);
    input.value = '';
    setTimeout(() => addMessage(getResponse(query)), 400);
  }

  askBtn.addEventListener('click', handleAsk);
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleAsk();
  });

  const quickButtons = [
    {id: 'chatQuickWudu', text: 'How do I perform wudu?'},
    {id: 'chatQuickPrayer', text: 'Tell me about prayer'},
    {id: 'chatQuickFasting', text: 'How does fasting work?'},
    {id: 'chatQuickZakat', text: 'What is zakat?'},
    {id: 'chatQuickHajj', text: 'Tell me about hajj'}
  ];

  quickButtons.forEach(({id, text}) => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener('click', () => {
        input.value = text;
        handleAsk();
      });
    }
  });
}

// ═══════════════════════════════════════════════════════
// SELECTORS
// ═══════════════════════════════════════════════════════

function initSelectors() {
  const transSelect = document.getElementById('translationSelect');
  const reciterSelect = document.getElementById('reciterSelect');
  const bookmarkBtn = document.getElementById('bookmarkAyahBtn');
  const viewBookmarksBtn = document.getElementById('viewBookmarksBtn');

  if (transSelect) {
    transSelect.addEventListener('change', () => {
      const surah = document.getElementById('surahSelect')?.value;
      if (surah) loadVerses();
    });
  }

  if (reciterSelect) {
    reciterSelect.addEventListener('change', () => {
      const surah = document.getElementById('surahSelect')?.value;
      if (surah) loadVerses();
    });
  }

  if (bookmarkBtn) {
    bookmarkBtn.addEventListener('click', () => {
      const surah = document.getElementById('surahSelect')?.value;
      if (!surah) { alert('Please select a surah first'); return; }
      const firstAyah = document.querySelector('.arabic-panel .ayah');
      if (firstAyah) {
        const ayahId = firstAyah.dataset.ayah;
        const text = firstAyah.querySelector('.ayah-text')?.textContent || '';
        bookmarkAyah(parseInt(surah), parseInt(ayahId), App.lastRead.name, text.substring(0, 60) + '...');
      }
    });
  }

  const toggleScrollBtn = document.getElementById('toggleScrollBtn');
  if (toggleScrollBtn) {
    toggleScrollBtn.addEventListener('click', () => {
      toggleScrollEnabled();
    });
  }

  if (viewBookmarksBtn) {
    viewBookmarksBtn.addEventListener('click', () => {
      const bookmarksNav = document.querySelector('[data-page="bookmarks"]');
      if (bookmarksNav) bookmarksNav.click();
    });
  }

  const openFeedbackBtn = document.getElementById('openFeedbackBtn');
  if (openFeedbackBtn) {
    openFeedbackBtn.addEventListener('click', () => {
      const feedbackNav = document.querySelector('[data-page="feedback"]');
      if (feedbackNav) feedbackNav.click();
    });
  }
}

function initFeedback() {
  emailjs.init('nuV6PLUTKCpKMZZ');

  const form = document.getElementById('feedbackForm');
  const nameInput = document.getElementById('feedbackName');
  const emailInput = document.getElementById('feedbackEmail');
  const messageInput = document.getElementById('feedbackMessage');
  const status = document.getElementById('feedbackStatus');

  if (!form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const name = nameInput?.value.trim() || 'Anonymous';
    const email = emailInput?.value.trim() || 'Not provided';
    const message = messageInput?.value.trim();

    if (!message) {
      if (status) status.textContent = 'Please type your message before sending.';
      return;
    }

    if (status) status.textContent = 'Sending your feedback...';

    const templateParams = {
      from_name: name,
      from_email: email,
      message,
      page_url: window.location.href
    };

    emailjs.send('Service_Jamiu', '_ejs-test-mail-service_', templateParams)
      .then(() => {
        if (status) status.textContent = 'Feedback sent! Thank you.';
        form.reset();
      })
      .catch((error) => {
        console.error('EmailJS send error:', error);
        if (status) status.textContent = 'Unable to send now. Please try again later.';
      });
  });
}

// ═══════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Noor app initializing...');
  
  initNavigation();
  initClock();
  updateDashboard();
  initTasbih();
  initChatbot();
  initHadithControls();
  initSelectors();
  updateScrollToggleButton();
  initFeedback();
  
  loadSurahs();
  
  console.log('✅ Noor app ready!');
});