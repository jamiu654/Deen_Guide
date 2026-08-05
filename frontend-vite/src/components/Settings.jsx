import { useEffect, useState } from "react";
import apiClient from "../apiClient";

const FALLBACK_RECITERS = [
  { value: "ar.alafasy", label: "Mishary Alafasy" },
  { value: "ar.husary", label: "Mohamed Siddiq Al-Husary" },
  { value: "ar.minshawi", label: "Muhammad Siddiq Al-Minshawi" },
];

function getBoolean(key, fallback) {
  const value = localStorage.getItem(key);
  if (value === null) return fallback;
  return value === "true";
}

export default function Settings() {
  const [soundEnabled, setSoundEnabled] = useState(
    getBoolean("deenSoundEnabled", true),
  );
  const [hadithLanguage, setHadithLanguage] = useState(
    localStorage.getItem("deenHadithLanguage") || "eng",
  );
  const [prayerAlertsEnabled, setPrayerAlertsEnabled] = useState(
    getBoolean("deenPrayerAlertsEnabled", true),
  );
  const [adhanSoundEnabled, setAdhanSoundEnabled] = useState(
    getBoolean("deenAdhanSoundEnabled", true),
  );
  const [darkModeEnabled, setDarkModeEnabled] = useState(
    getBoolean("deenDarkModeEnabled", true),
  );
  const [reciter, setReciter] = useState(
    localStorage.getItem("deenQuranReciter") || "ar.alafasy",
  );
  const [reciters, setReciters] = useState(FALLBACK_RECITERS);
  const [testStatus, setTestStatus] = useState("idle");

  useEffect(() => {
    async function loadReciters() {
      try {
        const data = await apiClient.fetchJson("/quran/reciters/");
        if (Array.isArray(data?.data) && data.data.length > 0) {
          setReciters(data.data);
        }
      } catch {
        setReciters(FALLBACK_RECITERS);
      }
    }

    void loadReciters();
  }, []);

  useEffect(() => {
    localStorage.setItem("deenSoundEnabled", String(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem("deenHadithLanguage", hadithLanguage);
  }, [hadithLanguage]);

  useEffect(() => {
    localStorage.setItem(
      "deenPrayerAlertsEnabled",
      String(prayerAlertsEnabled),
    );
  }, [prayerAlertsEnabled]);

  useEffect(() => {
    localStorage.setItem("deenAdhanSoundEnabled", String(adhanSoundEnabled));
  }, [adhanSoundEnabled]);

  useEffect(() => {
    localStorage.setItem("deenDarkModeEnabled", String(darkModeEnabled));
    document.body.classList.toggle("dark-mode", darkModeEnabled);
  }, [darkModeEnabled]);

  useEffect(() => {
    localStorage.setItem("deenQuranReciter", reciter);
  }, [reciter]);

  async function testReciter() {
    setTestStatus("testing");
    try {
      const response = await fetch(
        `/api/quran/audio/${encodeURIComponent(reciter)}/1/1.mp3`,
        { method: "GET" },
      );
      if (response.ok) {
        setTestStatus("ok");
      } else if (typeof window !== "undefined" && "speechSynthesis" in window) {
        setTestStatus("fallback");
      } else {
        setTestStatus("failed");
      }
    } catch {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        setTestStatus("fallback");
      } else {
        setTestStatus("failed");
      }
    }
    setTimeout(() => setTestStatus("idle"), 1800);
  }

  return (
    <section className="page card glass" id="settings">
      <div className="section-box glass">
        <h2 className="section-title">⚙️ Settings</h2>
        <p style={{ color: "var(--white-muted)", marginBottom: 20 }}>
          Customize your Deen Guide experience and keep the app aligned with
          your preferences.
        </p>
        <div
          className="settings-grid"
          style={{
            display: "grid",
            gap: "18px",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          }}
        >
          <div className="settings-card glass">
            <h3>Theme</h3>
            <p style={{ color: "var(--white-muted)", lineHeight: 1.7 }}>
              Toggle dark mode for the app. This setting persists across
              refreshes.
            </p>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={darkModeEnabled}
                onChange={(event) => setDarkModeEnabled(event.target.checked)}
              />
              <span>Dark Mode</span>
            </label>
          </div>
          <div className="settings-card glass">
            <h3>Sound effects</h3>
            <p style={{ color: "var(--white-muted)", lineHeight: 1.7 }}>
              Enable or disable interaction sounds for quiz and notification
              actions.
            </p>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(event) => setSoundEnabled(event.target.checked)}
              />
              <span>Sound Effects</span>
            </label>
          </div>
          <div className="settings-card glass">
            <h3>Prayer alerts</h3>
            <p style={{ color: "var(--white-muted)", lineHeight: 1.7 }}>
              Enable an alert and adhan sound when prayer times are available.
            </p>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={prayerAlertsEnabled}
                onChange={(event) =>
                  setPrayerAlertsEnabled(event.target.checked)
                }
              />
              <span>Prayer Time Alerts</span>
            </label>
            <label className="toggle-switch" style={{ marginTop: 12 }}>
              <input
                type="checkbox"
                checked={adhanSoundEnabled}
                onChange={(event) => setAdhanSoundEnabled(event.target.checked)}
              />
              <span>Adhan Sound</span>
            </label>
          </div>
          <div className="settings-card glass">
            <h3>Hadith Language</h3>
            <p style={{ color: "var(--white-muted)", lineHeight: 1.7 }}>
              Choose whether your hadith collection defaults to English or
              Arabic.
            </p>
            <select
              value={hadithLanguage}
              onChange={(event) => setHadithLanguage(event.target.value)}
              style={{
                width: "100%",
                padding: "0.95rem 1rem",
                borderRadius: "14px",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.05)",
                color: "#f8fafc",
              }}
            >
              <option value="eng">English hadith</option>
              <option value="ara">Arabic hadith</option>
            </select>
          </div>
          <div className="settings-card glass">
            <h3>Quran Reciter</h3>
            <p style={{ color: "var(--white-muted)", lineHeight: 1.7 }}>
              Choose the default reciter for remote playback. If a remote
              recitation is unavailable, the app will fall back to speech
              synthesis.
            </p>
            <select
              value={reciter}
              onChange={(e) => setReciter(e.target.value)}
              style={{
                width: "100%",
                padding: "0.95rem 1rem",
                borderRadius: "14px",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.05)",
                color: "#f8fafc",
              }}
            >
              {reciters.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
              <button type="button" className="secondary" onClick={testReciter}>
                ▶ Test Reciter
              </button>
              <div style={{ color: "var(--white-muted)", alignSelf: "center" }}>
                {testStatus === "testing" && "Testing..."}
                {testStatus === "ok" && "Available"}
                {testStatus === "fallback" && "Speech fallback ready"}
                {testStatus === "failed" && "Unavailable"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
