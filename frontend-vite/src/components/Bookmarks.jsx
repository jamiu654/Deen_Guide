import { useEffect, useState } from "react";
import { getSavedBookmarks, saveBookmarks } from "../bookmarkStorage";

export default function Bookmarks() {
  const [bookmarks, setBookmarks] = useState(() => getSavedBookmarks());

  useEffect(() => {
    const handleBookmarkUpdate = () => {
      setBookmarks(getSavedBookmarks());
    };

    window.addEventListener("bookmarksUpdated", handleBookmarkUpdate);
    return () => {
      window.removeEventListener("bookmarksUpdated", handleBookmarkUpdate);
    };
  }, []);

  const removeBookmark = (id) => {
    const filtered = bookmarks.filter((bookmark) => bookmark.id !== id);
    setBookmarks(filtered);
    saveBookmarks(filtered);
  };

  return (
    <section className="page card glass" id="bookmarks">
      <div className="section-box glass">
        <h2 className="section-title">🔖 Your Bookmarks</h2>
        <p style={{ color: "var(--white-muted)", marginBottom: 20 }}>
          Saved verses, hadith, and reminders are stored locally in your
          browser.
        </p>
        {bookmarks.length === 0 ? (
          <div
            className="result"
            style={{ padding: "2rem", textAlign: "center" }}
          >
            No bookmarks yet. Save a verse or hadith while using the Quran
            reader or hadith collection.
          </div>
        ) : (
          <div className="hadith-grid">
            {bookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                className="hadith-card glass"
                style={{ position: "relative" }}
              >
                <button
                  type="button"
                  className="bookmark-mini"
                  onClick={() => removeBookmark(bookmark.id)}
                  style={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    background: "none",
                    boxShadow: "none",
                    padding: "4px 8px",
                    fontSize: "1.2rem",
                    cursor: "pointer",
                  }}
                >
                  🗑
                </button>
                <h4 style={{ marginBottom: 12 }}>
                  {bookmark.type === "quran"
                    ? `📖 ${bookmark.surahName} ${bookmark.ayahId}`
                    : `📜 ${bookmark.collection} #${bookmark.hadithId}`}
                </h4>
                <p style={{ color: "#e2e8f0", lineHeight: 1.7 }}>
                  {bookmark.ayahText || bookmark.text}
                </p>
                <div className="source" style={{ marginTop: 16 }}>
                  Saved on {bookmark.date}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
