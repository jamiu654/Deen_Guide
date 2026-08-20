import { useEffect, useState, useRef } from "react";
import apiClient from "../apiClient";
import { playPageTurnSound } from "../bookPageSound";
const SURAH_LANGUAGES = [
  { value: "en.sahih", label: "English (Sahih International)" },
  { value: "ar.quran-uthmani", label: "Arabic (Uthmani)" },
  { value: "ur.ahmedali", label: "Urdu (Ahmed Ali)" },
];

const ARABIC_FONT_OPTIONS = [
  { value: "amiri", label: "Amiri", family: "'Amiri', serif" },
  {
    value: "scheherazade",
    label: "Scheherazade New",
    family: "'Scheherazade New', serif",
  },
  { value: "lateef", label: "Lateef", family: "'Lateef', serif" },
  {
    value: "noto-naskh",
    label: "Noto Naskh Arabic",
    family: "'Noto Naskh Arabic', serif",
  },
  { value: "aref-ruqaa", label: "Aref Ruqaa", family: "'Aref Ruqaa', serif" },
];

const RECITERS = {
  1: {
    code: "afs",
    name: "Mishary Al-Afasy",
    server: "server8",
    cdn: "ar.alafasy",
  },
  2: {
    code: "shatri",
    name: "Abu Bakr Al-Shatri",
    server: "server11",
    cdn: "ar.shatri",
  },
  3: {
    code: "qtm",
    name: "Nasser Al-Qatami",
    server: "server6",
    cdn: "ar.qtm",
  },
  4: {
    code: "yasser",
    name: "Yasser Al-Dosari",
    server: "server11",
    cdn: "ar.yasser",
  },
};

export default function QuranReader() {
  const [surahList, setSurahList] = useState([]);
  const [selectedSurah, setSelectedSurah] = useState("1");
  const [surahFilter, setSurahFilter] = useState("");
  const [language, setLanguage] = useState("ar.quran-uthmani");
  const [verses, setVerses] = useState([]);
  const filteredSurahList = surahList.filter((surah) => {
    const normalized =
      `${surah.number} ${surah.englishName} ${surah.name}`.toLowerCase();
    return normalized.includes(surahFilter.trim().toLowerCase());
  });
  const [surahName, setSurahName] = useState("Surah Al-Fatiha");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastRead, setLastRead] = useState(null);
  const synthRef = useRef(window.speechSynthesis);
  const audioRef = useRef(null);
  const [isPlayingRemote, setIsPlayingRemote] = useState(false);
  const [lastReadVerse, setLastReadVerse] = useState(null);
  const [resumePosition, setResumePosition] = useState(0);
  const [resumeAvailable, setResumeAvailable] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioVolume, setAudioVolume] = useState(1);
  const [audioRate, setAudioRate] = useState(1);
  const [currentAudioUrl, setCurrentAudioUrl] = useState("");
  const [audioError, setAudioError] = useState("");
  const [transliterations, setTransliterations] = useState({});
  const [transliterationPlacement, setTransliterationPlacement] =
    useState("belowText");
  const [secondaryLanguage, setSecondaryLanguage] = useState("");
  const [arabicFont, setArabicFont] = useState(ARABIC_FONT_OPTIONS[0].value);
  const [secondaryTexts, setSecondaryTexts] = useState({});
  const [showSurahList, setShowSurahList] = useState(true);
  const scrollTimeoutRef = useRef(null);
  const [bookMode, setBookMode] = useState(
    () => localStorage.getItem("deenQuranBookMode") === "true",
  );
  const touchStartRef = useRef(0);

  const [reciterId, setReciterId] = useState(
    Number(localStorage.getItem("deenQuranReciterId") || "1"),
  );

  useEffect(() => {
    try {
      localStorage.setItem("deenQuranReciterId", String(reciterId));
      const cdnName = RECITERS[reciterId]?.cdn || RECITERS[1].cdn;
      localStorage.setItem("deenQuranReciter", cdnName);
    } catch {}
  }, [reciterId]);

  useEffect(() => {
    try {
      localStorage.setItem("deenQuranArabicFont", arabicFont);
    } catch {}
  }, [arabicFont]);

  useEffect(() => {
    try {
      localStorage.setItem("deenQuranBookMode", bookMode);
    } catch {}
  }, [bookMode]);

  function formatTime(seconds) {
    if (!seconds || Number.isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  function setAudioElementProperties(audio) {
    if (!audio) return;
    audio.volume = audioVolume;
    audio.playbackRate = audioRate;
  }

  function attachAudioEvents(audio) {
    if (!audio) return;
    audio.onloadedmetadata = () => {
      setAudioDuration(audio.duration || 0);
      setAudioProgress(audio.currentTime || 0);
    };
    audio.ontimeupdate = () => {
      setAudioProgress(audio.currentTime || 0);
    };
    audio.onplay = () => setIsPlayingRemote(true);
    audio.onpause = () => setIsPlayingRemote(false);
    audio.onended = () => setIsPlayingRemote(false);
    audio.onerror = () => {
      setAudioError("Audio playback failed.");
      setIsPlayingRemote(false);
    };
  }

  function updateAudioPosition(position) {
    const audio = audioRef.current;
    if (!audio || audio.duration === 0) return;
    audio.currentTime = Math.min(Math.max(position, 0), audio.duration);
    setAudioProgress(audio.currentTime);
  }

  function handleVolumeChange(value) {
    setAudioVolume(value);
    if (audioRef.current) audioRef.current.volume = value;
  }

  function handleRateChange(value) {
    setAudioRate(value);
    if (audioRef.current) audioRef.current.playbackRate = value;
  }

  function goToNextSurah() {
    const currentNum = Number(selectedSurah);
    if (currentNum < 114) {
      setSelectedSurah(String(currentNum + 1));
      if (bookMode) playPageTurnSound();
    }
  }

  function goToPrevSurah() {
    const currentNum = Number(selectedSurah);
    if (currentNum > 1) {
      setSelectedSurah(String(currentNum - 1));
      if (bookMode) playPageTurnSound();
    }
  }

  function handleTouchStart(e) {
    if (bookMode) touchStartRef.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e) {
    if (!bookMode) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStartRef.current - touchEnd;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        goToNextSurah();
      } else {
        goToPrevSurah();
      }
    }
  }

  // HEAD check with timeout to quickly validate remote full-surah MP3 availability
  async function checkUrlHead(url, timeoutMs = 3000) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(url, {
        method: "HEAD",
        signal: controller.signal,
      });
      clearTimeout(id);
      return res && res.ok;
    } catch {
      return false;
    }
  }

  useEffect(() => {
    async function loadSurahList() {
      try {
        const data = await apiClient.fetchJson(`/quran/surahs/`);
        if (data.data) setSurahList(data.data);
      } catch (err) {
        setSurahList([
          { number: 1, englishName: "Al-Fatiha", name: "الفاتحة" },
          { number: 2, englishName: "Al-Baqarah", name: "البقرة" },
          { number: 36, englishName: "Ya-Sin", name: "يس" },
        ]);
        console.error(err);
      }
    }

    void loadSurahList();

    const stored = localStorage.getItem("deenQuranLastSurah");
    const storedVerse = localStorage.getItem("deenQuranLastVerse");
    if (stored) {
      setSelectedSurah(String(stored));
      setLastRead(stored);
    }
    if (storedVerse) setLastReadVerse(Number(storedVerse));
    const storedPosition = localStorage.getItem("deenQuranLastVersePosition");
    if (storedPosition) {
      const parsedPosition = Number(storedPosition);
      setResumePosition(parsedPosition);
      setResumeAvailable(parsedPosition > 0);
    }
    const storedPlacement = localStorage.getItem(
      "deenQuranTransliterationPlacement",
    );
    if (storedPlacement) {
      setTransliterationPlacement(storedPlacement);
    }
    const storedSecondary = localStorage.getItem("deenQuranSecondaryLanguage");
    if (storedSecondary) {
      setSecondaryLanguage(storedSecondary);
    }
    const storedArabicFont = localStorage.getItem("deenQuranArabicFont");
    if (storedArabicFont) {
      setArabicFont(storedArabicFont);
    }
  }, []);

  useEffect(() => {
    async function loadTransliteration(surahNumber) {
      try {
        const data = await apiClient.fetchJson(
          `/quran/surah/${surahNumber}/en.transliteration/`,
        );
        if (data.data?.ayahs) {
          const translitMap = (data.data.ayahs || []).reduce(
            (map, ayah) => ({
              ...map,
              [ayah.numberInSurah]: ayah.text,
            }),
            {},
          );
          setTransliterations(translitMap);
          return;
        }
      } catch {
        // ignore missing transliteration
      }
      setTransliterations({});
    }

    async function loadSecondaryText(surahNumber, lang) {
      if (!lang) {
        setSecondaryTexts({});
        return;
      }
      try {
        const data = await apiClient.fetchJson(
          `/quran/surah/${surahNumber}/${lang}/`,
        );
        if (data.data?.ayahs) {
          const textMap = (data.data.ayahs || []).reduce(
            (map, ayah) => ({
              ...map,
              [ayah.numberInSurah]: ayah.text,
            }),
            {},
          );
          setSecondaryTexts(textMap);
          return;
        }
      } catch {
        // ignore missing secondary language
      }
      setSecondaryTexts({});
    }

    async function fetchSurah() {
      setLoading(true);
      setError("");
      setVerses([]);
      try {
        const data = await apiClient.fetchJson(
          `/quran/surah/${selectedSurah}/${language}/`,
        );
        if (!data.data?.ayahs) {
          throw new Error("Unable to load the selected surah.");
        }
        setSurahName(data.data.englishName || data.data.name || "Surah");
        setVerses(data.data.ayahs);
        void loadTransliteration(selectedSurah);
        if (language.startsWith("ar")) {
          void loadSecondaryText(selectedSurah, secondaryLanguage);
        } else {
          setSecondaryTexts({});
        }
      } catch (err) {
        // Try CDN fallback (jsDelivr) if backend/api fails
        try {
          const cdnData = await fetchSurahFromCdn(selectedSurah, language);
          if (cdnData && cdnData.ayahs && cdnData.ayahs.length > 0) {
            setSurahName(cdnData.englishName || cdnData.name || "Surah");
            setVerses(cdnData.ayahs);
            return;
          }
        } catch (cdnErr) {
          console.warn("CDN fallback failed", cdnErr);
        }
        setError(err.message || "Failed to load Quran content.");
      } finally {
        setLoading(false);
      }
    }

    void fetchSurah();

    localStorage.setItem("deenQuranLastSurah", String(selectedSurah));
    setLastRead(String(selectedSurah));
  }, [selectedSurah, language, secondaryLanguage]);

  // Attempt to load surah from jsDelivr CDN (fawazahmed0/quran-api)
  async function fetchSurahFromCdn(surahNumber, lang) {
    // map common language/edition keys to likely edition names in the CDN
    const editionMap = {
      "ar.quran-uthmani": "quran-uthmani",
      "en.sahih": "en.sahih",
      "ur.ahmedali": "ur.ahmedali",
    };

    const editionGuess =
      editionMap[lang] ||
      (() => {
        // try derive from lang like 'en.xxx' -> 'en-xxx'
        return lang.replace(".", "-");
      })();

    const cdnBase =
      "https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions";
    const urlsToTry = [
      `${cdnBase}/${editionGuess}/${surahNumber}.json`,
      `${cdnBase}/${editionGuess}/${surahNumber}.min.json`,
      // try edition as-is (some editions use different naming)
      `${cdnBase}/${lang.replace(".", "-")}/${surahNumber}.json`,
    ];

    for (const url of urlsToTry) {
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const json = await res.json();
        // normalize into expected shape: { ayahs: [{ numberInSurah, text }, ...], englishName }
        if (Array.isArray(json)) {
          return {
            ayahs: json.map((v, i) => ({
              numberInSurah: v.number || i + 1,
              text: v.text || v,
            })),
          };
        }
        // Many edition files are objects with ayahs/verses under different keys
        if (json.ayahs)
          return {
            ayahs: json.ayahs,
            englishName: json.englishName || json.name,
          };
        if (json.verses)
          return {
            ayahs: json.verses,
            englishName: json.englishName || json.name,
          };
        // If the JSON contains chapters keyed by number
        if (json.chapter || json.chapters || json.ch) {
          const candidate =
            json.chapter ||
            json.chapters?.[surahNumber] ||
            json[Number(surahNumber)];
          if (candidate && candidate.ayahs)
            return {
              ayahs: candidate.ayahs,
              englishName: candidate.englishName || candidate.name,
            };
        }
        // If object contains verses as plain array under numeric key
        if (json[surahNumber]) {
          const arr = json[surahNumber];
          if (Array.isArray(arr))
            return {
              ayahs: arr.map((v, i) => ({
                numberInSurah: v.number || i + 1,
                text: v.text || v,
              })),
            };
        }
        // last-resort: try to find an array anywhere in the response that looks like ayahs
        const firstArray = Object.values(json).find(
          (v) => Array.isArray(v) && v.length > 0,
        );
        if (firstArray)
          return {
            ayahs: firstArray.map((v, i) => ({
              numberInSurah: v.number || i + 1,
              text: v.text || v,
            })),
          };
      } catch {
        // try next url
        continue;
      }
    }
    throw new Error("CDN: unable to load surah from jsDelivr");
  }

  // Auto-scroll to the last-read verse when verses load
  useEffect(() => {
    if (!lastReadVerse || !verses || verses.length === 0) return;
    // give React time to paint DOM nodes
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      try {
        const el = document.querySelector(".verse-card.last-read");
        if (el && typeof el.scrollIntoView === "function") {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      } catch {}
    }, 120);

    return () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [verses, lastReadVerse]);

  function playRecitation() {
    if (!verses || verses.length === 0) return;
    if (!synthRef.current) return;
    try {
      synthRef.current.cancel();
    } catch {}
    const text = verses.map((v) => v.text).join("\n\n");
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.95;
    const voices = synthRef.current.getVoices();
    if (language.startsWith("ar")) {
      const v = voices.find((x) => x.lang && x.lang.startsWith("ar"));
      if (v) utter.voice = v;
    } else {
      const v = voices.find((x) => x.lang && x.lang.startsWith("en"));
      if (v) utter.voice = v;
    }
    synthRef.current.speak(utter);
  }

  function pauseRemoteRecitation() {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    } catch {}
    setIsPlayingRemote(false);
    try {
      if (audioRef.current && lastReadVerse != null) {
        saveLastReadVerse(
          selectedSurah,
          Number(lastReadVerse),
          audioRef.current.currentTime || 0,
        );
      }
    } catch {}
  }

  function restartRecitation() {
    saveLastReadVerse(selectedSurah, 1, 0);
    stopRemoteRecitation();
    setAudioProgress(0);
    setAudioDuration(0);
  }

  function resumeRemoteRecitation() {
    if (!audioRef.current) {
      playRemoteRecitation();
      return;
    }
    try {
      setAudioElementProperties(audioRef.current);
      audioRef.current.play().catch(() => {
        playRemoteRecitation();
      });
    } catch {
      playRemoteRecitation();
    }
  }

  function stopRemoteRecitation() {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    } catch {}
    try {
      if (synthRef.current) synthRef.current.cancel();
    } catch {}
    setIsPlayingRemote(false);
    setCurrentAudioUrl("");
  }

  function getCurrentVerseIndex() {
    if (!verses || verses.length === 0) return -1;
    const currentIndex = verses.findIndex(
      (verse) => verse.numberInSurah === Number(lastReadVerse),
    );
    return currentIndex >= 0 ? currentIndex : 0;
  }

  function playPreviousVerse() {
    if (verses.length === 0) return;
    const currentIndex = getCurrentVerseIndex();
    const prevIndex = Math.max(currentIndex - 1, 0);
    if (prevIndex === currentIndex) return;
    const verse = verses[prevIndex];
    if (!verse) return;
    saveLastReadVerse(selectedSurah, verse.numberInSurah, 0);
    setAudioProgress(0);
    if (isPlayingRemote) {
      playRemoteRecitation();
    }
  }

  function playNextVerse() {
    if (verses.length === 0) return;
    const currentIndex = getCurrentVerseIndex();
    const nextIndex = Math.min(currentIndex + 1, verses.length - 1);
    if (nextIndex === currentIndex) return;
    const verse = verses[nextIndex];
    if (!verse) return;
    saveLastReadVerse(selectedSurah, verse.numberInSurah, 0);
    setAudioProgress(0);
    if (isPlayingRemote) {
      playRemoteRecitation();
    }
  }

  function downloadRecitation() {
    const reciterDef = RECITERS[reciterId] || RECITERS[1];
    const url = `https://${reciterDef.server}.mp3quran.net/${reciterDef.code}/${String(
      selectedSurah,
    ).padStart(3, "0")}.mp3`;
    const a = document.createElement("a");
    a.href = url;
    a.download = `surah-${selectedSurah}-${reciterDef.code}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // Remote recitation playback (per-verse chaining)
  async function checkRemoteAudio(url) {
    // Use server-side check endpoint to avoid browser CORS errors when
    // probing the CDN directly. Call the API route without duplicating
    // the '/api' prefix so apiClient handles base paths correctly.
    try {
      if (!url) return false;
      // Local proxy path: '/api/quran/audio/reciter/surah/verse.mp3' or '/quran/audio/...'
      if (url.startsWith("/")) {
        const parts = url.replace(/^\//, "").split("/");
        // expect ['api','quran','audio','reciter','surah','verse.mp3'] or ['quran',...]
        const startIndex = parts[0] === "api" ? 3 : 2; // index of reciter
        const reciter = parts[startIndex];
        const surah = parts[startIndex + 1];
        const verse = (parts[startIndex + 2] || "").replace(".mp3", "");
        if (!reciter || !surah || !verse) return false;
        const checkPath = `quran/audio/check/${reciter}/${surah}/${verse}/`;
        const res = await apiClient.fetchJson(checkPath).catch(() => null);
        return !!res;
      }

      // CDN URL: extract reciter/surah/verse using regex
      const m = url.match(
        /quran\/audio\/(?:\d+\/)?([^/]+)\/(\d+)\/(\d+)\.mp3$/,
      );
      if (!m) return false;
      const [, reciter, surah, verse] = m;
      const checkPath = `quran/audio/check/${reciter}/${surah}/${verse}/`;
      const res = await apiClient.fetchJson(checkPath).catch(() => null);
      return !!res;
    } catch {
      return false;
    }
  }

  async function playRemoteRecitation(resume = false) {
    // Try legacy mp3quran full-surah audio first (uses `main/index.js` mapping).
    // Fall back to per-verse CDN -> server proxy -> TTS fallback if needed.
    const reciterId = Number(localStorage.getItem("deenQuranReciterId") || "1");
    const reciterDef = RECITERS[reciterId] || RECITERS[1];
    const mp3quranUrl = `https://${reciterDef.server}.mp3quran.net/${reciterDef.code}/${String(selectedSurah).padStart(3, "0")}.mp3`;

    const cdnReciter = localStorage.getItem("deenQuranReciter") || "ar.alafasy";
    const cdnBase = `https://cdn.islamic.network/quran/audio/128/${cdnReciter}`;
    const localBase = `/api/quran/audio/${encodeURIComponent(cdnReciter)}`;
    if (!verses || verses.length === 0) return;

    // Attempt to play the full-surah MP3 from mp3quran first, but do a
    // quick HEAD check to avoid long stall on unavailable URLs.
    try {
      const ok = await checkUrlHead(mp3quranUrl, 3000);
      if (ok) {
        if (!audioRef.current) audioRef.current = new Audio();
        const fullAudio = audioRef.current;
        fullAudio.crossOrigin = "anonymous";
        fullAudio.preload = "metadata";
        attachAudioEvents(fullAudio);
        setAudioElementProperties(fullAudio);
        fullAudio.src = mp3quranUrl;
        setCurrentAudioUrl(mp3quranUrl);
        setAudioError("");
        await fullAudio.play();
        setIsPlayingRemote(true);
        fullAudio.onended = () => {
          setIsPlayingRemote(false);
          saveLastReadVerse(
            selectedSurah,
            verses[verses.length - 1].numberInSurah,
            0,
          );
          setCurrentAudioUrl("");
        };
        fullAudio.onerror = () => {
          fullAudio.pause();
          fullAudio.src = "";
          setIsPlayingRemote(false);
          setAudioError("Full surah recitation could not be played.");
          setCurrentAudioUrl("");
        };
        return;
      }
    } catch {
      // proceed to per-verse fallback
    }

    // Try CDN first, then local proxy fallback
    const cdnFirst = `${cdnBase}/${selectedSurah}/${verses[0].numberInSurah}.mp3`;
    let available = await checkRemoteAudio(cdnFirst);
    let base = available ? cdnBase : null;
    if (!available) {
      const localFirst = `${localBase}/${selectedSurah}/${verses[0].numberInSurah}.mp3`;
      available = await checkRemoteAudio(localFirst);
      if (available) base = localBase;
    }
    if (!available) {
      playRecitation();
      return;
    }

    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.crossOrigin = "anonymous";
      audioRef.current.preload = "metadata";
      attachAudioEvents(audioRef.current);
    }
    const audio = audioRef.current;
    setAudioElementProperties(audio);
    let startIndex = 0;
    let resumeTime = 0;

    if (
      resume &&
      lastRead === selectedSurah &&
      lastReadVerse != null &&
      resumePosition > 0
    ) {
      const found = verses.findIndex(
        (verse) => verse.numberInSurah === Number(lastReadVerse),
      );
      if (found >= 0) {
        startIndex = found;
        resumeTime = Number(resumePosition);
      }
    }

    let idx = startIndex;
    setIsPlayingRemote(true);

    const cleanupHandlers = () => {
      try {
        audio.onended = null;
        audio.onerror = null;
        audio.ontimeupdate = null;
        audio.onloadedmetadata = null;
      } catch {}
    };

    audio.onerror = () => {
      cleanupHandlers();
      stopRemoteRecitation();
      playRecitation();
    };

    audio.ontimeupdate = () => {
      setAudioProgress(audio.currentTime || 0);
      if (!audio || !verses[idx]) return;
      saveLastReadVerse(
        selectedSurah,
        verses[idx].numberInSurah,
        audio.currentTime,
      );
    };

    const playIndex = () => {
      if (idx >= verses.length) {
        cleanupHandlers();
        saveLastReadVerse(
          selectedSurah,
          verses[verses.length - 1].numberInSurah,
          0,
        );
        setIsPlayingRemote(false);
        setCurrentAudioUrl("");
        return;
      }
      const verse = verses[idx];
      const url = `${base}/${selectedSurah}/${verse.numberInSurah}.mp3`;
      audio.src = url;
      setCurrentAudioUrl(url);
      audio.onloadedmetadata = () => {
        if (resumeTime > 0 && idx === startIndex) {
          audio.currentTime = Math.min(resumeTime, audio.duration - 0.2);
          resumeTime = 0;
        }
      };
      audio.play().catch(() => {
        cleanupHandlers();
        setIsPlayingRemote(false);
        setCurrentAudioUrl("");
        playRecitation();
      });
      audio.onended = () => {
        idx += 1;
        playIndex();
      };
    };

    playIndex();
  }

  function saveLastReadVerse(surah, verseNumber, position = 0) {
    try {
      localStorage.setItem("deenQuranLastSurah", String(surah));
      localStorage.setItem("deenQuranLastVerse", String(verseNumber));
      localStorage.setItem("deenQuranLastVersePosition", String(position));
      setLastRead(String(surah));
      setLastReadVerse(Number(verseNumber));
      setResumePosition(Number(position));
      setResumeAvailable(position > 0);
    } catch {}
  }

  return (
    <section className="card section-card">
      <h2>📖 Quran Reader</h2>
      <p className="section-intro">
        Read Quran verses from the cloud, switch between Arabic and translated
        editions, and continue where you left off.
      </p>
      {showSurahList ? (
        <div className="surah-selection-panel">
          <div className="selection-intro">
            <h3>Select a Surah</h3>
            <p>
              Browse the full Quran list and tap a surah to open the recitation
              experience.
            </p>
          </div>
          <div className="reader-controls">
            <input
              type="text"
              placeholder="Search surah by number or name…"
              value={surahFilter}
              onChange={(event) => setSurahFilter(event.target.value)}
              className="surah-search"
            />
          </div>
          <div className="surah-grid">
            {filteredSurahList.length > 0 ? (
              filteredSurahList.map((surah) => (
                <button
                  key={surah.number}
                  type="button"
                  className={`surah-card ${String(surah.number) === selectedSurah ? "active" : ""}`}
                  onClick={() => {
                    setSelectedSurah(String(surah.number));
                    setShowSurahList(false);
                  }}
                >
                  <div className="surah-card-number">{surah.number}</div>
                  <div>
                    <strong>{surah.englishName}</strong>
                    <div className="surah-card-name">{surah.name}</div>
                  </div>
                </button>
              ))
            ) : (
              <div
                className="surah-card no-results"
                style={{ cursor: "default" }}
              >
                No surah matches your search.
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="recitation-header">
            <button
              type="button"
              className="secondary back-button"
              onClick={() => setShowSurahList(true)}
            >
              ← Back to Surah List
            </button>
            <div className="reader-summary">
              <div className="surah-badge">Surah {selectedSurah}</div>
              <h3>{surahName}</h3>
              <p className="subtext">
                Your recitation controls are now visible. Use the buttons below
                to play, pause, restart, and switch text settings.
              </p>
            </div>
          </div>
          <div className="reader-controls">
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
            >
              {SURAH_LANGUAGES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {language.startsWith("ar") && (
              <select
                value={arabicFont}
                onChange={(event) => setArabicFont(event.target.value)}
              >
                {ARABIC_FONT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
            {language.startsWith("ar") && (
              <select
                value={secondaryLanguage}
                onChange={(event) => {
                  const value = event.target.value;
                  setSecondaryLanguage(value);
                  try {
                    localStorage.setItem("deenQuranSecondaryLanguage", value);
                  } catch {}
                }}
              >
                <option value="">Below Arabic: none</option>
                <option value="en.sahih">Below Arabic: English</option>
                <option value="ur.ahmedali">Below Arabic: Urdu</option>
                <option value="en.transliteration">
                  Below Arabic: Transliteration
                </option>
              </select>
            )}
            <select
              value={transliterationPlacement}
              onChange={(event) => {
                const value = event.target.value;
                setTransliterationPlacement(value);
                try {
                  localStorage.setItem(
                    "deenQuranTransliterationPlacement",
                    value,
                  );
                } catch {}
              }}
            >
              <option value="belowText">
                Below Arabic / selected translation text
              </option>
              <option value="hidden">Hide transliteration</option>
            </select>
            <select
              value={reciterId}
              onChange={(e) => setReciterId(Number(e.target.value))}
            >
              {Object.entries(RECITERS).map(([id, r]) => (
                <option key={id} value={id}>
                  {r.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className={bookMode ? "active" : ""}
              onClick={() => setBookMode(!bookMode)}
              title="Toggle book page mode with page-turn sound"
              style={{
                backgroundColor: bookMode
                  ? "rgba(10, 184, 129, 0.2)"
                  : "transparent",
              }}
            >
              📖 Book Mode
            </button>
            <div className="quran-action-buttons">
              <button
                type="button"
                onClick={() => {
                  const hasPausedAudio = !!currentAudioUrl && !isPlayingRemote;
                  if (isPlayingRemote) {
                    pauseRemoteRecitation();
                  } else if (hasPausedAudio) {
                    resumeRemoteRecitation();
                  } else {
                    playRemoteRecitation();
                  }
                }}
              >
                {isPlayingRemote
                  ? "⏸ Pause"
                  : currentAudioUrl
                    ? "▶ Resume"
                    : "▶ Play Recitation"}
              </button>
              <button
                type="button"
                onClick={restartRecitation}
                className="secondary"
              >
                Restart
              </button>
              <button
                type="button"
                onClick={playPreviousVerse}
                className="secondary"
                disabled={!isPlayingRemote || verses.length === 0}
              >
                ⏮ Prev
              </button>
              <button
                type="button"
                onClick={playNextVerse}
                className="secondary"
                disabled={!isPlayingRemote || verses.length === 0}
              >
                ⏭ Next
              </button>
              <button
                type="button"
                onClick={downloadRecitation}
                className="secondary"
              >
                ⬇ Download
              </button>
              {resumeAvailable && lastRead === selectedSurah && (
                <button
                  type="button"
                  onClick={() => playRemoteRecitation(true)}
                  className="secondary"
                >
                  ▶ Resume
                </button>
              )}
            </div>
          </div>
          {currentAudioUrl && (
            <p
              style={{ margin: "0.65rem 0 0", color: "rgba(148,163,184,0.9)" }}
            >
              Now playing:{" "}
              {currentAudioUrl.includes("mp3quran")
                ? "Full surah recitation"
                : "Verse audio"}
            </p>
          )}
          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <label style={{ minWidth: 82 }}>Progress</label>
              <input
                type="range"
                min={0}
                max={audioDuration || 1}
                value={audioProgress}
                onChange={(e) => updateAudioPosition(Number(e.target.value))}
                style={{ flex: 1 }}
              />
              <span style={{ width: 72, textAlign: "right" }}>
                {formatTime(audioProgress)} / {formatTime(audioDuration)}
              </span>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <label style={{ minWidth: 82 }}>Volume</label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={audioVolume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                style={{ flex: 1 }}
              />
              <span>{Math.round(audioVolume * 100)}%</span>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <label style={{ minWidth: 82 }}>Speed</label>
              <input
                type="range"
                min={0.75}
                max={1.5}
                step={0.05}
                value={audioRate}
                onChange={(e) => handleRateChange(Number(e.target.value))}
                style={{ flex: 1 }}
              />
              <span>{audioRate.toFixed(2)}x</span>
            </div>
            {audioError && (
              <div style={{ color: "#fecaca", fontSize: "0.95rem" }}>
                {audioError}
              </div>
            )}
          </div>
          {resumeAvailable && lastRead === selectedSurah && (
            <p
              style={{ margin: "0.65rem 0 0", color: "rgba(226,232,240,0.8)" }}
            >
              Resume from verse {lastReadVerse} at {Math.round(resumePosition)}
              s.
            </p>
          )}
        </>
      )}

      {loading && (
        <div className="result" style={{ padding: "1.5rem" }}>
          Loading Quran verses…
        </div>
      )}

      {error && (
        <div className="result" style={{ padding: "1.5rem", color: "#fecaca" }}>
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="reader-result">
          <div className="result" style={{ marginBottom: 16 }}>
            <strong>{surahName}</strong>
            <p style={{ margin: "0.5rem 0 0", color: "rgba(226,232,240,0.8)" }}>
              {verses.length} verses loaded from the Quran API.
            </p>
          </div>
          <div
            className="verse-list"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            style={bookMode ? { touchAction: "pan-y" } : {}}
          >
            {verses.map((verse) => (
              <article
                key={verse.numberInSurah}
                className={`verse-card ${
                  lastReadVerse === verse.numberInSurah ? "last-read" : ""
                }`}
                onClick={() =>
                  saveLastReadVerse(selectedSurah, verse.numberInSurah)
                }
                role="button"
                tabIndex={0}
              >
                <div className="verse-number">{verse.numberInSurah}</div>
                <p
                  className="verse-text"
                  dir={language.startsWith("ar") ? "rtl" : "ltr"}
                  style={
                    language.startsWith("ar")
                      ? {
                          fontFamily:
                            ARABIC_FONT_OPTIONS.find(
                              (option) => option.value === arabicFont,
                            )?.family || ARABIC_FONT_OPTIONS[0].family,
                        }
                      : undefined
                  }
                >
                  {verse.text}
                </p>
                {secondaryLanguage && secondaryTexts[verse.numberInSurah] && (
                  <p className="verse-transliteration">
                    {secondaryTexts[verse.numberInSurah]}
                  </p>
                )}
                {transliterationPlacement === "belowText" &&
                  transliterations[verse.numberInSurah] && (
                    <p className="verse-transliteration">
                      {transliterations[verse.numberInSurah]}
                    </p>
                  )}
              </article>
            ))}
          </div>
          {bookMode && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                marginTop: 16,
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                disabled={Number(selectedSurah) <= 1}
                onClick={goToPrevSurah}
              >
                ◀ Previous Surah
              </button>
              <span
                style={{ color: "var(--white-muted)", alignSelf: "center" }}
              >
                Surah {selectedSurah} of 114 📖
              </span>
              <button
                type="button"
                disabled={Number(selectedSurah) >= 114}
                onClick={goToNextSurah}
              >
                Next Surah ▶
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
