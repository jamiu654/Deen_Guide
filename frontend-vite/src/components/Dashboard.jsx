import { useEffect, useState } from "react";
import "./Dashboard.css";
import apiClient from "../apiClient";
import { getTasbihCount } from "../bookmarkStorage";

const DEFAULT_DAILY_HADITH = {
  text: "The best among you are those with the best manners and character.",
  narrator: "Sahih al-Bukhari",
};

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

function StatCard({ title, value, children }) {
  return (
    <div className="stat-card">
      <h4>{title}</h4>
      <div className="value">{value}</div>
      {children}
    </div>
  );
}

export default function Dashboard() {
  const [lastReadLabel, setLastReadLabel] = useState("No recent read");
  const [nextPrayerLabel, setNextPrayerLabel] = useState("--:--");
  const [nextPrayerStatus, setNextPrayerStatus] = useState("Locating...");
  const [dailyHadith, setDailyHadith] = useState(DEFAULT_DAILY_HADITH);
  const [tasbihCount, setTasbihCount] = useState(0);

  useEffect(() => {
    setTasbihCount(getTasbihCount());

    const handleStorageChange = () => {
      setTasbihCount(getTasbihCount());
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("tasbihUpdated", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("tasbihUpdated", handleStorageChange);
    };
  }, []);

  useEffect(() => {
    try {
      const surah = localStorage.getItem("deenQuranLastSurah");
      const verse = localStorage.getItem("deenQuranLastVerse");
      if (surah) {
        setLastReadLabel(`Surah ${surah}${verse ? ` · Verse ${verse}` : ""}`);
      }
    } catch {}
  }, []);

  useEffect(() => {
    let active = true;

    async function loadDailyHadith() {
      try {
        const data = await apiClient.fetchJson(
          "/hadith/?collection=bukhari&language=eng",
        );
        const items = Array.isArray(data?.hadiths)
          ? data.hadiths.filter(
              (item) => item && (item.text || item.hadith || item.hadithtext),
            )
          : [];

        if (!items.length) {
          setDailyHadith(DEFAULT_DAILY_HADITH);
          return;
        }

        const today = new Date();
        const seedString = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
        let hash = 0;
        for (const char of seedString) {
          hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
        }
        const chosenIndex = hash % items.length;
        const chosen = items[chosenIndex];
        const hadithText =
          chosen.text || chosen.hadith || chosen.hadithtext || "";

        setDailyHadith({
          text: hadithText,
          narrator: chosen.narrator || "Sahih al-Bukhari",
        });
      } catch {
        setDailyHadith(DEFAULT_DAILY_HADITH);
      }
    }

    void loadDailyHadith();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function updateNextPrayer(prayerTimes) {
      if (!active || !prayerTimes) return;
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const prayerNames = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
      let nextPrayer = null;
      let minDiff = Infinity;

      prayerNames.forEach((name) => {
        const prayerTime = parsePrayerTime(prayerTimes[name]);
        if (!prayerTime) return;
        const prayerMinutes =
          prayerTime.getHours() * 60 + prayerTime.getMinutes();
        const diff = prayerMinutes - currentMinutes;
        if (diff > 0 && diff < minDiff) {
          minDiff = diff;
          nextPrayer = name;
        }
      });

      if (nextPrayer && prayerTimes[nextPrayer]) {
        setNextPrayerLabel(`${nextPrayer} · ${prayerTimes[nextPrayer]}`);
        setNextPrayerStatus(`${formatNextLabel(minDiff)} until ${nextPrayer}`);
      } else {
        setNextPrayerLabel("--:--");
        setNextPrayerStatus("Next prayer tomorrow");
      }
    }

    async function loadPrayerTimes() {
      try {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              try {
                const data = await apiClient.fetchJson(
                  `/prayer-times/?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&method=2`,
                );
                if (data.data?.timings) {
                  updateNextPrayer(data.data.timings);
                  return;
                }
                throw new Error("Prayer times unavailable");
              } catch {
                const fallback = await apiClient.fetchJson(
                  `/prayer-times/?latitude=21.4225&longitude=39.8262&method=4`,
                );
                if (fallback.data?.timings) {
                  updateNextPrayer(fallback.data.timings);
                }
              }
            },
            async () => {
              const fallback = await apiClient.fetchJson(
                `/prayer-times/?latitude=21.4225&longitude=39.8262&method=4`,
              );
              if (fallback.data?.timings) {
                updateNextPrayer(fallback.data.timings);
              }
            },
            { timeout: 8000 },
          );
        } else {
          const fallback = await apiClient.fetchJson(
            `/prayer-times/?latitude=21.4225&longitude=39.8262&method=4`,
          );
          if (fallback.data?.timings) {
            updateNextPrayer(fallback.data.timings);
          }
        }
      } catch {
        if (!active) return;
        setNextPrayerLabel("--:--");
        setNextPrayerStatus("Unable to load prayer times");
      }
    }

    loadPrayerTimes();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="dashboard-grid">
      <StatCard title="LAST READ" value={lastReadLabel} />
      <StatCard
        title="TASBIH COUNT"
        value={`${tasbihCount} total dhikr today 📿`}
      />
      <StatCard title="NEXT PRAYER" value={nextPrayerLabel}>
        <div className="status">{nextPrayerStatus}</div>
      </StatCard>
      <StatCard title="RAMADAN" value="217 days until Ramadan 2027 🌙" />
      <div className="wide-card">
        <h3>DAILY HADITH</h3>
        <p className="hadith">
          “{dailyHadith.text}” · {dailyHadith.narrator}
        </p>
      </div>
    </div>
  );
}
