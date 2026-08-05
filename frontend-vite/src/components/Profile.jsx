import { useEffect, useState, useRef } from "react";
import { getBookmarkCount } from "../bookmarkStorage";

export default function Profile({ user, onLogout, onLoginNavigate }) {
  const [bookmarkCount, setBookmarkCount] = useState(getBookmarkCount());
  const [showUpdated, setShowUpdated] = useState(false);
  const prevCountRef = useRef(bookmarkCount);

  useEffect(() => {
    const handleBookmarkUpdate = () => {
      setBookmarkCount(getBookmarkCount());
    };

    window.addEventListener("bookmarksUpdated", handleBookmarkUpdate);
    return () => {
      window.removeEventListener("bookmarksUpdated", handleBookmarkUpdate);
    };
  }, []);

  useEffect(() => {
    const prev = prevCountRef.current;
    if (typeof prev === "number" && prev !== bookmarkCount) {
      setShowUpdated(true);
      const t = setTimeout(() => setShowUpdated(false), 3000);
      return () => clearTimeout(t);
    }
    prevCountRef.current = bookmarkCount;
    return undefined;
  }, [bookmarkCount]);

  return (
    <section className="card section-card">
      <h2>Your Profile</h2>
      {user ? (
        <>
          <div className="profile-card">
            <div className="profile-card-header">
              <div className="profile-avatar">👤</div>
              <div>
                <h3>{user.username}</h3>
                <p className="section-intro">
                  Welcome back! Your account details are shown below.
                </p>
              </div>
            </div>
            <div className="profile-details">
              {showUpdated && (
                <div
                  style={{
                    marginBottom: 10,
                    display: "inline-block",
                    background: "#ecfeff",
                    color: "#064e3b",
                    padding: "6px 10px",
                    borderRadius: 6,
                    fontSize: "0.95rem",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                  }}
                >
                  Bookmarks updated ({bookmarkCount})
                </div>
              )}
              <div>
                <strong>Username</strong>
                <p>{user.username}</p>
              </div>
              <div>
                <strong>Email</strong>
                <p>{user.email || "Not available"}</p>
              </div>
              <div>
                <strong>Account status</strong>
                <p>Signed in</p>
              </div>
              <div>
                <strong>Saved bookmarks</strong>
                <p>{bookmarkCount}</p>
              </div>
            </div>
          </div>
          <div className="profile-actions">
            <button type="button" className="secondary" onClick={onLogout}>
              Log out
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="section-intro">
            You are not currently signed in. Please log in or create an account
            to access your profile and saved preferences.
          </p>
          <button type="button" onClick={onLoginNavigate}>
            Go to Login / Register
          </button>
        </>
      )}
    </section>
  );
}
