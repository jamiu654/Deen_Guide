import { useEffect, useMemo, useState, useCallback } from "react";
import { getSavedBookmarks, saveBookmarks } from "../bookmarkStorage";
import apiClient from "../apiClient";
const HADITH_COLLECTIONS = [
  { key: "bukhari", label: "Sahih al-Bukhari" },
  { key: "muslim", label: "Sahih Muslim" },
  { key: "abudawud", label: "Sunan Abu Dawud" },
  { key: "ibnmajah", label: "Sunan Ibn Majah" },
  { key: "tirmidhi", label: "Jami at-Tirmidhi" },
  { key: "nasai", label: "Sunan an-Nasai" },
];

function normalizeHadithPayload(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.hadiths)) return data.hadiths;
  if (data && Array.isArray(data.data)) return data.data;
  if (data && typeof data === "object") {
    for (const key of Object.keys(data)) {
      if (Array.isArray(data[key]) && data[key].length > 0) {
        return data[key];
      }
    }
  }
  return [];
}

export default function Hadith() {
  const [language, setLanguage] = useState(
    () => localStorage.getItem("deenHadithLanguage") || "eng",
  );
  const [collectionKey, setCollectionKey] = useState("bukhari");
  const [page, setPage] = useState(1);
  const [hadiths, setHadiths] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedHadith, setSelectedHadith] = useState(null);
  const [bookmarks, setBookmarksState] = useState(getSavedBookmarks());
  const [searchTerm, setSearchTerm] = useState("");

  const currentCollection = useMemo(
    () => `${language}-${collectionKey}`,
    [language, collectionKey],
  );

  const filteredHadiths = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return hadiths;

    return hadiths.filter((hadith) => {
      const entryText = [
        hadith.text,
        hadith.hadith,
        hadith.hadithtext,
        hadith.narrator,
        hadith.grade,
        hadith.grades?.join(" "),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return entryText.includes(term);
    });
  }, [hadiths, searchTerm]);

  const pageCount = useMemo(
    () => Math.ceil(filteredHadiths.length / 6),
    [filteredHadiths],
  );
  const pagedHadiths = useMemo(
    () => filteredHadiths.slice((page - 1) * 6, page * 6),
    [filteredHadiths, page],
  );

  useEffect(() => {
    localStorage.setItem("deenHadithLanguage", language);
  }, [language]);

  const loadHadithCollection = useCallback(
    async (collection) => {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({ collection, language });
        const data = await apiClient.fetchJson(`/hadith/?${params.toString()}`);
        const items = normalizeHadithPayload(data).filter(
          (item) => item && (item.text || item.hadith || item.hadithtext),
        );
        setHadiths(items);
      } catch (err) {
        setError(err.message || "Unable to load hadith collection.");
        setHadiths([]);
      } finally {
        setLoading(false);
      }
    },
    [language],
  );

  useEffect(() => {
    void loadHadithCollection(currentCollection);
  }, [currentCollection, page, loadHadithCollection]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  useEffect(() => {
    saveBookmarks(bookmarks);
  }, [bookmarks]);

  function handleBookmark(hadith) {
    const id = `${hadith.hadithnumber || hadith.arabicnumber || `${currentCollection}-${hadith.text || hadith.hadith || hadith.hadithtext || "item"}`}-${currentCollection}`;
    const text = hadith.text || hadith.hadith || hadith.hadithtext || "";
    const header = `Hadith #${hadith.hadithnumber || hadith.arabicnumber || id}`;
    const bookmark = {
      id,
      type: "hadith",
      hadithId: hadith.hadithnumber || hadith.arabicnumber || id,
      collection: currentCollection,
      header,
      text: text.substring(0, 300),
      date: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    };
    setBookmarksState((current) => [bookmark, ...current]);
  }

  function openModal(hadith) {
    const text = hadith.text || hadith.hadith || hadith.hadithtext || "";
    const isArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(text);
    setSelectedHadith({
      title: `Hadith #${hadith.hadithnumber || hadith.arabicnumber || "?"}`,
      narrator: hadith.narrator || "",
      text,
      isArabic,
      grade:
        Array.isArray(hadith.grades) && hadith.grades.length
          ? hadith.grades.join(", ")
          : hadith.grade || "",
      source:
        HADITH_COLLECTIONS.find((item) => item.key === collectionKey)?.label ||
        currentCollection,
    });
  }

  function closeModal() {
    setSelectedHadith(null);
  }

  return (
    <section className="page card glass" id="hadith">
      <div className="section-box glass">
        <div
          style={{
            marginBottom: 22,
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h2 className="section-title">📜 Hadith Collection</h2>
            <p
              style={{
                color: "var(--white-muted)",
                maxWidth: 780,
                lineHeight: 1.7,
              }}
            >
              Browse trusted hadith collections, bookmark passages, and open
              full hadith details for study.
            </p>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              type="button"
              className={language === "eng" ? "active" : ""}
              onClick={() => setLanguage("eng")}
            >
              English
            </button>
            <button
              type="button"
              className={language === "ara" ? "active" : ""}
              onClick={() => setLanguage("ara")}
            >
              Arabic
            </button>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(200px, 320px) 1fr",
            gap: 16,
            marginBottom: 18,
          }}
        >
          <div className="settings-card glass" style={{ padding: 18 }}>
            <h3 style={{ marginBottom: 12 }}>Selected Collection</h3>
            <select
              value={collectionKey}
              onChange={(event) => {
                setCollectionKey(event.target.value);
                setPage(1);
              }}
            >
              {HADITH_COLLECTIONS.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => loadHadithCollection(currentCollection)}
            >
              Load Collection
            </button>
          </div>
          <div className="settings-card glass" style={{ padding: 18 }}>
            <h3 style={{ marginBottom: 12 }}>Search Hadith</h3>
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by keyword, narrator, or grade"
              aria-label="Search hadith"
              style={{ width: "100%" }}
            />
            {searchTerm && (
              <p style={{ marginTop: 10, color: "var(--white-muted)" }}>
                Showing {filteredHadiths.length} result
                {filteredHadiths.length === 1 ? "" : "s"}
              </p>
            )}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(200px, 320px) 1fr",
            gap: 16,
            marginBottom: 18,
          }}
        >
          <div
            className="result hadith-summary"
            style={{
              minHeight: 118,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <p className="hadith-count" style={{ margin: 0 }}>
              Displaying <strong>{filteredHadiths.length}</strong> hadiths from{" "}
              {language === "ara" ? "Arabic" : "English"} {collectionKey}.
            </p>
            <p
              className="hadith-hint"
              style={{ margin: "8px 0 0", color: "var(--white-muted)" }}
            >
              Use the cards below to open a full hadith, bookmark your
              favorites, or page through the collection.
            </p>
          </div>
        </div>

        {loading && (
          <div className="result" style={{ padding: 24, textAlign: "center" }}>
            Loading hadiths...
          </div>
        )}

        {error && (
          <div
            className="result"
            style={{ padding: 24, textAlign: "center", color: "#fecaca" }}
          >
            <p>{error}</p>
            <button
              type="button"
              onClick={() => loadHadithCollection(currentCollection)}
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && !selectedHadith && (
          <>
            {filteredHadiths.length === 0 ? (
              <div
                className="result"
                style={{ padding: 28, textAlign: "center" }}
              >
                <p style={{ margin: 0, color: "var(--white-muted)" }}>
                  No hadiths match your search. Try another keyword, narrator,
                  or collection.
                </p>
              </div>
            ) : (
              <>
                <div
                  className="hadith-grid"
                  style={{
                    display: "grid",
                    gap: 16,
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  }}
                >
                  {pagedHadiths.map((hadith, index) => {
                    const id =
                      hadith.hadithnumber || hadith.arabicnumber || index + 1;
                    const text =
                      hadith.text ||
                      hadith.hadith ||
                      hadith.hadithtext ||
                      "No text available";
                    const isArabic =
                      /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(text);
                    const shortText =
                      text.length > 280 ? `${text.substring(0, 280)}...` : text;
                    const narrator = hadith.narrator || "";
                    const grade =
                      Array.isArray(hadith.grades) && hadith.grades.length
                        ? hadith.grades.join(", ")
                        : hadith.grade || "";

                    return (
                      <article
                        key={`${currentCollection}-${id}`}
                        className={`hadith-card glass ${isArabic ? "is-arabic" : ""}`}
                        style={{ position: "relative" }}
                      >
                        <button
                          type="button"
                          className="bookmark-mini"
                          title="Bookmark Hadith"
                          style={{
                            position: "absolute",
                            top: 12,
                            right: 12,
                            background: "none",
                            boxShadow: "none",
                            padding: "4px 8px",
                            fontSize: "1.2rem",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBookmark(hadith);
                          }}
                        >
                          🔖
                        </button>
                        <h4 style={{ marginBottom: 12 }}>Hadith #{id}</h4>
                        {narrator ? (
                          <p className="hadith-narrator">
                            <strong>{narrator}</strong>
                          </p>
                        ) : null}
                        <p
                          className="hadith-text"
                          style={{
                            marginBottom: 12,
                            color: "#e2e8f0",
                            lineHeight: 1.7,
                          }}
                        >
                          {shortText}
                        </p>
                        {grade ? (
                          <div
                            className="hadith-grade"
                            style={{ marginBottom: 10 }}
                          >
                            Grade: {grade}
                          </div>
                        ) : null}
                        <div
                          className="source"
                          style={{ color: "var(--white-muted)" }}
                        >
                          {HADITH_COLLECTIONS.find(
                            (item) => item.key === collectionKey,
                          )?.label || currentCollection}
                        </div>
                        <button
                          type="button"
                          style={{ marginTop: 14 }}
                          onClick={() => openModal(hadith)}
                        >
                          Read full hadith
                        </button>
                      </article>
                    );
                  })}
                </div>

                <div
                  className="quiz-actions"
                  style={{
                    justifyContent: "space-between",
                    marginTop: 18,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() =>
                      setPage((current) => Math.max(1, current - 1))
                    }
                  >
                    Previous
                  </button>
                  <span
                    style={{ color: "var(--white-muted)", alignSelf: "center" }}
                  >
                    Page {page} of {pageCount || 1}
                  </span>
                  <button
                    type="button"
                    disabled={page >= pageCount}
                    onClick={() =>
                      setPage((current) => Math.min(pageCount, current + 1))
                    }
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {selectedHadith && (
          <div
            className="result glass"
            style={{
              padding: 0,
              borderRadius: 28,
              maxWidth: 980,
              margin: "0 auto",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "22px 24px 18px",
                borderBottom: "1px solid rgba(148, 163, 184, 0.2)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
                background: "rgba(15, 23, 42, 0.3)",
              }}
            >
              <div>
                <div
                  style={{
                    color: "var(--white-muted)",
                    fontSize: "0.72rem",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    marginBottom: 6,
                  }}
                >
                  {selectedHadith.source}
                </div>
                <h3 style={{ margin: 0 }}>{selectedHadith.title}</h3>
              </div>
              <button type="button" onClick={closeModal}>
                ← Back to collection
              </button>
            </div>

            <div style={{ padding: 24 }}>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 12,
                  marginBottom: 18,
                }}
              >
                {selectedHadith.narrator && (
                  <span
                    style={{
                      background: "rgba(34, 197, 94, 0.12)",
                      border: "1px solid rgba(34, 197, 94, 0.3)",
                      color: "#dcfce7",
                      borderRadius: 999,
                      padding: "7px 12px",
                    }}
                  >
                    {selectedHadith.narrator}
                  </span>
                )}
                {selectedHadith.grade && (
                  <span
                    style={{
                      background: "rgba(96, 165, 250, 0.12)",
                      border: "1px solid rgba(96, 165, 250, 0.3)",
                      color: "#dbeafe",
                      borderRadius: 999,
                      padding: "7px 12px",
                    }}
                  >
                    Grade: {selectedHadith.grade}
                  </span>
                )}
              </div>

              <article
                style={{
                  background: "rgba(15, 23, 42, 0.35)",
                  border: "1px solid rgba(148, 163, 184, 0.18)",
                  borderRadius: 22,
                  padding: "24px 20px",
                }}
              >
                <div
                  style={{
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.9,
                    color: selectedHadith.isArabic ? "#f8fafc" : "#e2e8f0",
                    fontSize: selectedHadith.isArabic ? "1.28rem" : "1.06rem",
                    textAlign: selectedHadith.isArabic ? "right" : "left",
                    direction: selectedHadith.isArabic ? "rtl" : "ltr",
                  }}
                >
                  {selectedHadith.text}
                </div>
              </article>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
