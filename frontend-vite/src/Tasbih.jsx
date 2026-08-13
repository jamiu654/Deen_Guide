import { useEffect, useMemo, useState } from "react";
import "./Tasbih.css";
import { playBeadTapSound } from "./bookPageSound";

const DHIKR_OPTIONS = [
  { value: "subhanallah", label: "SubhanAllah", limit: 33 },
  { value: "alhamdulillah", label: "Alhamdulillah", limit: 33 },
  { value: "allahuakbar", label: "Allahu Akbar", limit: 33 },
  { value: "lailaha", label: "La ilaha illallah", limit: 100 },
  { value: "astaghfirullah", label: "Astaghfirullah", limit: 100 },
  { value: "salawaat", label: "Durud / Salawat", limit: 100 },
];

// Generate beads display - show the next available beads to tap
function generateBeads(count, limit) {
  const beads = [];
  const cyclePos = count % limit;

  // Show 10 beads at a time for tapping
  const beadsToShow = 10;
  const startIndex = cyclePos;

  for (let i = 0; i < beadsToShow; i++) {
    const beadIndex = startIndex + i;
    const isCountedInThisCycle = beadIndex < cyclePos;
    const isSeparator = (beadIndex + 1) % 10 === 0;

    beads.push({
      id: beadIndex,
      index: i,
      isSeparator,
      isCounted: false,
      isTapped: false,
    });
  }

  // Add counted beads that have moved
  const countedBeads = [];
  for (let i = 0; i < cyclePos % beadsToShow; i++) {
    countedBeads.push({
      id: `counted-${i}`,
      index: i,
      isCounted: true,
      isSeparator: false,
    });
  }

  return { activeBeads: beads, countedBeads };
}

export default function Tasbih() {
  const [count, setCount] = useState(() => {
    const saved = localStorage.getItem("tasbih");
    return saved !== null ? parseInt(saved, 10) || 0 : 0;
  });
  const [dhikr, setDhikr] = useState("subhanallah");
  const [tappedBead, setTappedBead] = useState(null);

  useEffect(() => {
    localStorage.setItem("tasbih", String(count));
    window.dispatchEvent(new Event("tasbihUpdated"));
  }, [count]);

  const currentLimit = useMemo(
    () => DHIKR_OPTIONS.find((item) => item.value === dhikr)?.limit || 33,
    [dhikr],
  );

  const cycleCount = count % currentLimit;
  const cyclesComplete = Math.floor(count / currentLimit);

  const { activeBeads, countedBeads } = generateBeads(count, currentLimit);

  const handleBeadTap = (beadIndex) => {
    setTappedBead(beadIndex);
    setCount((current) => current + 1);
    playBeadTapSound();
    if (navigator.vibrate) navigator.vibrate([10, 30, 10]);

    setTimeout(() => setTappedBead(null), 500);
  };

  const resetTasbih = () => {
    setCount(0);
  };

  const clearTasbih = () => {
    if (window.confirm("Clear all tasbih history?")) {
      setCount(0);
    }
  };

  return (
    <section className="page card glass" id="tasbih">
      <div className="section-box glass">
        <div className="tasbih-header">
          <div>
            <h2 className="section-title">📿 Digital Tasbih</h2>
            <p className="tasbih-subtitle">
              Tap the beads to count your dhikr, just like a real tasbih
            </p>
          </div>
          <div className="tasbih-selector">
            <label>Choose remembrance</label>
            <select
              value={dhikr}
              onChange={(event) => setDhikr(event.target.value)}
            >
              {DHIKR_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tasbih Display */}
        <div className="tasbih-display">
          {/* Counted beads (moved to the side) */}
          <div className="beads-counted">
            {countedBeads.map((bead) => (
              <div key={bead.id} className="bead bead-counted"></div>
            ))}
          </div>

          {/* String line */}
          <div className="string-line">
            {/* Active beads to tap */}
            <div className="beads-container">
              {activeBeads.map((bead) => (
                <button
                  key={bead.id}
                  type="button"
                  className={`bead ${bead.isSeparator ? "separator" : ""} ${
                    tappedBead === bead.index ? "tapped" : ""
                  }`}
                  onClick={() => handleBeadTap(bead.index)}
                  aria-label={`Bead ${bead.index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="tasbih-stats">
          <div className="stat-item">
            <span className="stat-label">Current cycle</span>
            <span className="stat-value">
              {cycleCount} / {currentLimit}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total count</span>
            <span className="stat-value">{count}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Cycles complete</span>
            <span className="stat-value">{cyclesComplete}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="tasbih-progress">
          <div
            className="progress-fill"
            style={{ width: `${(cycleCount / currentLimit) * 100}%` }}
          ></div>
        </div>

        {/* Controls */}
        <div className="tasbih-controls">
          <button type="button" onClick={resetTasbih} className="secondary">
            Reset Cycle
          </button>
          <button type="button" onClick={clearTasbih} className="danger">
            Clear All
          </button>
        </div>
      </div>
    </section>
  );
}
