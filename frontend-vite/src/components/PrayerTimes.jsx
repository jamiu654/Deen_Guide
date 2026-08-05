import { useEffect, useMemo, useState } from "react";
import apiClient from "../apiClient";
const PRAYER_ORDER = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];
const FARD_PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
const ADHAN_AUDIO = [
  "https://cdn.aladhan.com/audio/adhans/a1.mp3",
  "https://cdn.aladhan.com/audio/adhans/a9.mp3",
  "https://www.islamcan.com/audio/adhan/azan20.mp3",
];

function parsePrayerTime(timeText) {
  const match = String(timeText || "").match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function formatNextLabel(minutes) {
  if (minutes <= 0) return "Now";
  if (minutes === 1) return "1 minute";
  return `${minutes} minutes`;
}

function playAdhanSound() {
  const audio = new Audio(ADHAN_AUDIO[0]);
  audio.volume = 0.8;
  audio.play().catch(() => {});
}

export default function PrayerTimes() {
  const [times, setTimes] = useState(null);
  const [location, setLocation] = useState("Locating...");
  const [hijriDate, setHijriDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [nextPrayerLabel, setNextPrayerLabel] = useState("--:--");
  const [nextPrayerStatus, setNextPrayerStatus] = useState("Loading...");

  const prayerAlertsEnabled = useMemo(() => {
    try {
      return JSON.parse(
        localStorage.getItem("deenPrayerAlertsEnabled") ?? "true",
      );
    } catch {
      return true;
    }
  }, []);

  const adhanSoundEnabled = useMemo(() => {
    try {
      return JSON.parse(
        localStorage.getItem("deenAdhanSoundEnabled") ?? "true",
      );
    } catch {
      return true;
    }
  }, []);

  useEffect(() => {
    let timers = [];
    let active = true;

    async function requestNotificationPermission() {
      if (!("Notification" in window)) return false;
      if (Notification.permission === "granted") return true;
      if (Notification.permission === "denied") return false;
      try {
        const permission = await Notification.requestPermission();
        return permission === "granted";
      } catch {
        return false;
      }
    }

    function triggerPrayerAlert(prayerName, test = false) {
      if (adhanSoundEnabled) {
        playAdhanSound();
      }
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(test ? "Adhan test" : `${prayerName} prayer time`, {
          body: test
            ? "This is a test prayer sound."
            : `It is time for ${prayerName}.`,
        });
      }
    }

    function schedulePrayerAlerts(prayerTimes) {
      if (!prayerAlertsEnabled || !prayerTimes) return;
      const now = new Date();
      for (const prayerName of FARD_PRAYERS) {
        const prayerTime = parsePrayerTime(prayerTimes[prayerName]);
        if (!prayerTime) continue;
        const delay = prayerTime.getTime() - now.getTime();
        if (delay <= 0) continue;
        const timerId = window.setTimeout(
          () => triggerPrayerAlert(prayerName),
          delay,
        );
        timers.push(timerId);
      }
    }

    async function loadPrayerTimes() {
      setLoading(true);
      setError("");
      setTimes(null);
      setLocation("Locating...");
      setHijriDate(null);

      const updateState = (fetchedTimes, fetchedLocation, fetchedHijriDate) => {
        if (!active) return;
        setTimes(fetchedTimes);
        setLocation(fetchedLocation || "Your Location");
        setHijriDate(fetchedHijriDate);
        setLoading(false);

        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        let nextPrayer = null;
        let minDiff = Infinity;

        FARD_PRAYERS.forEach((name) => {
          const prayerTime = parsePrayerTime(fetchedTimes[name]);
          if (!prayerTime) return;
          const prayerMinutes =
            prayerTime.getHours() * 60 + prayerTime.getMinutes();
          const diff = prayerMinutes - currentMinutes;
          if (diff > 0 && diff < minDiff) {
            minDiff = diff;
            nextPrayer = name;
          }
        });

        if (nextPrayer && fetchedTimes[nextPrayer]) {
          setNextPrayerLabel(fetchedTimes[nextPrayer]);
          setNextPrayerStatus(`${nextPrayer} in ${formatNextLabel(minDiff)}`);
        } else {
          setNextPrayerLabel("--:--");
          setNextPrayerStatus("Next prayer tomorrow");
        }

        if (prayerAlertsEnabled) {
          const granted = Notification.permission === "granted";
          if (granted) schedulePrayerAlerts(fetchedTimes);
          else
            requestNotificationPermission().then((allowed) => {
              if (allowed) schedulePrayerAlerts(fetchedTimes);
            });
        }
      };

      const fetchPrayerTimes = async (latitude, longitude, method) => {
        const data = await apiClient.fetchJson(
          `/prayer-times/?latitude=${latitude}&longitude=${longitude}&method=${method}`,
        );
        if (!data.data?.timings) {
          throw new Error("Prayer times data is unavailable.");
        }
        updateState(data.data.timings, "Your Location", data.data.date?.hijri);
      };

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              await fetchPrayerTimes(
                position.coords.latitude,
                position.coords.longitude,
                2,
              );
            } catch {
              try {
                const fallbackData = await apiClient.fetchJson(
                  `/prayer-times/?latitude=21.4225&longitude=39.8262&method=4`,
                );
                if (fallbackData.data?.timings) {
                  updateState(
                    fallbackData.data.timings,
                    "Makkah (Default)",
                    fallbackData.data.date?.hijri,
                  );
                } else {
                  throw new Error("Fallback prayer times not found.");
                }
              } catch (err) {
                setError(err.message || "Unable to load prayer times.");
                setLoading(false);
              }
            }
          },
          async () => {
            try {
              const fallbackData = await apiClient.fetchJson(
                `/prayer-times/?latitude=21.4225&longitude=39.8262&method=4`,
              );
              if (fallbackData.data?.timings) {
                updateState(
                  fallbackData.data.timings,
                  "Makkah (Default)",
                  fallbackData.data.date?.hijri,
                );
              } else {
                throw new Error("Fallback prayer times not found.");
              }
            } catch (err) {
              setError(
                err.message ||
                  "Unable to determine location or load prayer times.",
              );
              setLoading(false);
            }
          },
          { timeout: 10000 },
        );
      } else {
        try {
          const data = await apiClient.fetchJson(
            `/prayer-times/?latitude=21.4225&longitude=39.8262&method=4`,
          );
          if (data.data?.timings) {
            updateState(
              data.data.timings,
              "Makkah (Default)",
              data.data.date?.hijri,
            );
          } else {
            throw new Error("Fallback prayer times not found.");
          }
        } catch (err) {
          setError(err.message || "Unable to load prayer times.");
          setLoading(false);
        }
      }
    }

    loadPrayerTimes();

    return () => {
      active = false;
      timers.forEach((timerId) => window.clearTimeout(timerId));
    };
  }, [prayerAlertsEnabled, adhanSoundEnabled]);

  return (
    <section className="page card glass" id="prayer">
      <div className="section-box glass">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
            marginBottom: 20,
          }}
        >
          <div>
            <h2 className="section-title">🕌 Prayer Times</h2>
            <p
              style={{
                color: "var(--white-muted)",
                maxWidth: 700,
                lineHeight: 1.7,
              }}
            >
              View today’s prayer schedule for your location, watch the next
              prayer time, and keep your worship routine on track.
            </p>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              type="button"
              className="secondary"
              onClick={() => window.location.reload()}
            >
              Refresh Times
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => {
                if (adhanSoundEnabled) {
                  playAdhanSound();
                }
                if (
                  "Notification" in window &&
                  Notification.permission === "granted"
                ) {
                  new Notification("Adhan test", {
                    body: "This is how your prayer alert will sound.",
                  });
                }
              }}
            >
              Test Adhan
            </button>
          </div>
        </div>

        <div
          className="result"
          style={{
            padding: 20,
            display: "flex",
            flexWrap: "wrap",
            gap: 14,
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ color: "var(--white-muted)", marginBottom: 6 }}>
              Location
            </div>
            <strong>{location}</strong>
          </div>
          <div>
            <div style={{ color: "var(--white-muted)", marginBottom: 6 }}>
              Hijri Date
            </div>
            <strong>
              {hijriDate
                ? `${hijriDate.day} ${hijriDate.month.en} ${hijriDate.year} AH`
                : "Loading..."}
            </strong>
          </div>
          <div>
            <div style={{ color: "var(--white-muted)", marginBottom: 6 }}>
              Next Prayer
            </div>
            <strong>{nextPrayerLabel}</strong>
            <div style={{ color: "var(--gold-300)", marginTop: 4 }}>
              {nextPrayerStatus}
            </div>
          </div>
        </div>

        {loading && (
          <div className="result" style={{ textAlign: "center", padding: 24 }}>
            Loading prayer times…
          </div>
        )}

        {error && (
          <div
            className="result"
            style={{ textAlign: "center", padding: 24, color: "#fecaca" }}
          >
            {error}
          </div>
        )}

        {!loading && !error && times && (
          <div
            className="hadith-grid"
            style={{
              display: "grid",
              gap: 16,
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              marginTop: 18,
            }}
          >
            {PRAYER_ORDER.map((name) => {
              const prayerTime = times[name] || "--:--";
              const isActive = name === nextPrayerStatus.split(" ")[0];
              return (
                <article
                  key={name}
                  className={`prayer-card glass ${isActive ? "active" : ""}`}
                >
                  <div className="prayer-name">{name}</div>
                  <div className="prayer-time">{prayerTime}</div>
                  {isActive && <div className="prayer-status">Up Next</div>}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
