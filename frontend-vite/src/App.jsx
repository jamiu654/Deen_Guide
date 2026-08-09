import { useEffect, useState } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import QuranReader from "./components/QuranReader";
import Hadith from "./components/Hadith";
import Tasbih from "./Tasbih";
import PrayerTimes from "./components/PrayerTimes";
import Quiz from "./components/Quiz";
import Chatbot from "./components/Chatbot";
import Bookmarks from "./components/Bookmarks";
import Settings from "./components/Settings";
import Contact from "./components/Contact";
import Auth from "./components/Auth";
import Profile from "./components/Profile";
import apiClient from "./apiClient";

const topLinks = [
  { key: "dashboard", label: "Home" },
  { key: "about", label: "About" },
  { key: "services", label: "Services" },
  { key: "history", label: "History" },
  { key: "contact", label: "Contact" },
];

function App() {
  const [view, setView] = useState("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [clock, setClock] = useState("00:00:00");
  const [todayLabel, setTodayLabel] = useState("Loading date...");
  const [authUser, setAuthUser] = useState(null);

  useEffect(() => {
    document.title = "Deen Guide";
    const darkModePreference = localStorage.getItem("deenDarkModeEnabled");
    const isDarkMode =
      darkModePreference === null || darkModePreference === "true";
    document.body.classList.toggle("dark-mode", isDarkMode);

    const tick = () => {
      const now = new Date();
      setClock(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
      setTodayLabel(
        now.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        }),
      );
    };

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);

useEffect(() => {
  async function loadAuthStatus() {
    try {
      const data = await apiClient.fetchJson("/auth/status/");

      if (data.authenticated) {
        setAuthUser({
          username: data.username,
          email: data.email || "",
        });
      }
    } catch (error) {
      // Ignore authentication status failures for now
      console.error("Authentication status check failed:", error);
    }
  }

  loadAuthStatus();
}, []);
       

  const handleNavigate = (nextView) => {
    setView(nextView);
    setMenuOpen(false);
    setSidebarOpen(false);
  };

  const toggleSidebar = () => {
    setSidebarOpen((open) => !open);
    setMenuOpen(false);
  };

  const handleAuthUpdate = (user) => {
    setAuthUser({
      username: user.username,
      email: user.email || "",
    });
    setView("dashboard");
  };

  const handleLoginNavigate = () => {
    setView("auth");
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout/", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      // ignore network errors
    }
    setAuthUser(null);
    setView("dashboard");
  };

  return (
    <div className="app-shell">
      <div className="bg-glow" />
      <div className="bg-glow-2" />
      <div
        className={`sidebar-backdrop ${sidebarOpen ? "visible" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />
      <Sidebar
        onNavigate={handleNavigate}
        activeView={view}
        isOpen={sidebarOpen}
      />
      <div className="app-content">
        <header className="app-header">
          <div>
            <h1>Deen Guide</h1>
            <p>Faith, knowledge, prayer guidance, and calm daily reflection.</p>
          </div>
          <div className="header-actions">
            <div className="header-badge">
              <span className="badge-logo" aria-hidden>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 2C13.1046 2 14 2.89543 14 4v6c0 1.1046-.8954 2-2 2s-2-.8954-2-2V4c0-1.10457.8954-2 2-2zM6 8c0-2.2091 1.7909-4 4-4v2c-1.1046 0-2 .8954-2 2s.8954 2 2 2v2c-2.2091 0-4-1.7909-4-4zM18 8c0 2.2091-1.7909 4-4 4v-2c1.1046 0 2-.8954 2-2s-.8954-2-2-2V4c2.2091 0 4 1.7909 4 4z"
                    fill="currentColor"
                  />
                </svg>
              </span>
              <span className="badge-text">Islamic Companion</span>
            </div>

            {authUser ? (
              <div className="account-box">
                <span className="account-username">
                  Signed in as {authUser.username}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="secondary"
                >
                  Log out
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setView("auth")}
                className="button primary login-button"
                aria-label="Sign in or Register"
              >
                <span className="btn-icon" aria-hidden>
                  👤
                </span>
                <span className="btn-text">Sign in / Register</span>
              </button>
            )}
          </div>
        </header>

        <nav className="top-nav">
          <button
            type="button"
            className={`sidebar-toggle ${sidebarOpen ? "active" : ""}`}
            onClick={toggleSidebar}
          >
            ☰ Sidebar
          </button>
          <button
            type="button"
            className="top-menu-toggle"
            onClick={() => setMenuOpen((open) => !open)}
          >
            ☰ Menu
          </button>
          <div className={`top-links ${menuOpen ? "open" : ""}`}>
            {topLinks.map((link) => (
              <button
                key={link.key}
                type="button"
                className={view === link.key ? "active" : ""}
                onClick={() => handleNavigate(link.key)}
              >
                {link.label}
              </button>
            ))}
          </div>
        </nav>

        <main className="app-main-layout">
          <div className="content-panel">
            {view === "dashboard" && (
              <>
                <section className="card hero-card">
                  <div>
                    <p className="eyebrow">Assalamu Alaikum</p>
                    <h2>Welcome back to your daily companion.</h2>
                    <p className="hero-sub">
                      Open Quran, check prayer time, read hadith, or ask the
                      assistant for guidance.
                    </p>
                  </div>
                  <div className="hero-side">
                    <div className="hero-clock">{clock}</div>
                    <div className="hero-date">{todayLabel}</div>
                  </div>
                </section>

                <section className="dashboard-panel">
                  <Dashboard />
                </section>

                <section className="card section-card">
                  <h3>Need help or want to share feedback?</h3>
                  <p className="section-intro">
                    Tap the contact tab or use the button to open the support
                    page directly.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleNavigate("contact")}
                  >
                    Open Contact Page
                  </button>
                </section>
              </>
            )}

            {view === "about" && (
              <section className="card section-card">
                <h2>About Deen Guide</h2>
                <p className="section-intro">
                  Deen Guide is an Islamic companion built to make daily
                  learning and worship easier.
                </p>
                <div className="info-grid">
                  <div className="info-card">
                    <h3>What this web app does</h3>
                    <p>
                      It brings Quran reading, hadith browsing, prayer times,
                      dhikr counting, Islamic questions, bookmarks, and quiz
                      learning into one simple place.
                    </p>
                  </div>
                  <div className="info-card">
                    <h3>Our goal</h3>
                    <p>
                      We want this to become more than a website. With your
                      support and feedback, we would like to develop Deen Guide
                      into a full mobile app that is fast, helpful, and easy for
                      Muslims to use every day.
                    </p>
                  </div>
                  <div className="info-card">
                    <h3>Built for benefit</h3>
                    <p>
                      The project is designed for students, families, and anyone
                      who wants a gentle way to read, remember, revise, and grow
                      in Islamic knowledge.
                    </p>
                  </div>
                </div>
              </section>
            )}

            {view === "services" && (
              <section className="card section-card">
                <h2>Services</h2>
                <div className="info-grid">
                  <div className="info-card">
                    <h3>Quran Tools</h3>
                    <p>
                      Read Quran translations, view Arabic verses, listen to
                      reciters, save bookmarks, and continue from your last read
                      surah.
                    </p>
                  </div>
                  <div className="info-card">
                    <h3>Daily Worship</h3>
                    <p>
                      Check prayer times, use the digital tasbih, track dhikr,
                      and keep useful Islamic reminders close at hand.
                    </p>
                  </div>
                  <div className="info-card">
                    <h3>Learning Features</h3>
                    <p>
                      Study hadith, ask the Islamic assistant common questions,
                      play the quiz game, and explore prophet stories in the
                      history page.
                    </p>
                  </div>
                  <div className="info-card">
                    <h3>Future App Plans</h3>
                    <p>
                      We hope to add mobile app support, offline access, better
                      learning paths, more stories, reminders, and improved
                      feedback features.
                    </p>
                  </div>
                </div>
              </section>
            )}

            {view === "history" && (
              <section className="card section-card">
                <h2>History & Stories of Prophets</h2>
                <p className="section-intro">
                  Short reminders from the lives of noble prophets, written for
                  reflection and learning.
                </p>
                <div className="story-grid">
                  <article className="story-card">
                    <h3>Prophet Adam (AS)</h3>
                    <p>
                      Adam (AS) was the first human being and the first prophet.
                      His story reminds us that people can make mistakes, return
                      to Allah sincerely, and be forgiven through repentance.
                    </p>
                  </article>
                  <article className="story-card">
                    <h3>Prophet Nuh (AS)</h3>
                    <p>
                      Nuh (AS) called his people to worship Allah for many years
                      with patience and courage.
                    </p>
                  </article>
                  <article className="story-card">
                    <h3>Prophet Ibrahim (AS)</h3>
                    <p>
                      Ibrahim (AS) stood against idol worship and submitted
                      fully to Allah. He is remembered for deep faith and
                      sacrifice.
                    </p>
                  </article>
                  <article className="story-card">
                    <h3>Prophet Yusuf (AS)</h3>
                    <p>
                      Yusuf (AS) faced jealousy, separation, temptation, prison,
                      and hardship, yet remained patient and faithful.
                    </p>
                  </article>
                  <article className="story-card">
                    <h3>Prophet Ayyub (AS)</h3>
                    <p>
                      Ayyub (AS) is remembered for patience during severe
                      illness and loss, while continuing to rely on Allah.
                    </p>
                  </article>
                  <article className="story-card">
                    <h3>Prophet Musa (AS)</h3>
                    <p>
                      Musa (AS) faced Pharaoh with the message of truth and
                      relied on Allah through hardship.
                    </p>
                  </article>
                  <article className="story-card">
                    <h3>Prophet Dawud (AS)</h3>
                    <p>
                      Dawud (AS) was given wisdom, leadership, and a beautiful
                      recitation of the Zabur.
                    </p>
                  </article>
                  <article className="story-card">
                    <h3>Prophet Muhammad (SAW)</h3>
                    <p>
                      Muhammad (SAW) is the final prophet, sent as a mercy to
                      mankind.
                    </p>
                  </article>
                </div>
              </section>
            )}

            {view === "chat" && <Chatbot />}
            {view === "quran" && <QuranReader onNavigate={handleNavigate} />}
            {view === "hadith" && <Hadith />}
            {view === "tasbih" && <Tasbih />}
            {view === "prayer" && <PrayerTimes />}
            {view === "quiz" && <Quiz />}
            {view === "bookmarks" && <Bookmarks />}
            {view === "settings" && <Settings />}
            {view === "contact" && <Contact />}
            {view === "profile" && (
              <Profile
                user={authUser}
                onLogout={handleLogout}
                onLoginNavigate={handleLoginNavigate}
              />
            )}
            {view === "auth" && (
              <Auth user={authUser} onAuthChange={handleAuthUpdate} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
