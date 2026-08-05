import "./Sidebar.css";

const links = [
  { key: "dashboard", label: "Dashboard", icon: "🏠" },
  { key: "profile", label: "Profile", icon: "👤" },
  { key: "quran", label: "Quran Reader", icon: "📖" },
  { key: "hadith", label: "Hadith Collection", icon: "📜" },
  { key: "prayer", label: "Prayer Times", icon: "🕌" },
  { key: "tasbih", label: "Digital Tasbih", icon: "📿" },
  { key: "chat", label: "Islamic Assistant", icon: "💬" },
  { key: "quiz", label: "Quiz Game", icon: "❓" },
  { key: "bookmarks", label: "Bookmarks", icon: "🔖" },
  { key: "settings", label: "Settings", icon: "⚙️" },
];

export default function Sidebar({ onNavigate, activeView, isOpen }) {
  return (
    <aside className={`sidebar ${isOpen ? "open" : "closed"}`}>
      <div
        className={`logo nav-logo ${activeView === "dashboard" ? "active" : ""}`}
        role="button"
        tabIndex={0}
        onClick={() => onNavigate("dashboard")}
      >
        <h1>Deen_Guide</h1>
        <p>Your Islamic Companion</p>
      </div>
      <nav className="sidebar-nav">
        {links.map((link) => (
          <button
            key={link.key}
            className={`nav-btn ${activeView === link.key ? "active" : ""}`}
            data-page={link.key}
            data-icon={link.icon}
            onClick={() => onNavigate(link.key)}
          >
            {link.label}
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">Made with faith & code</div>
    </aside>
  );
}
