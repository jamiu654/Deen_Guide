import { useEffect, useMemo, useState } from "react";

const DHIKR_OPTIONS = [
  { value: "subhanallah", label: "SubhanAllah", limit: 33 },
  { value: "alhamdulillah", label: "Alhamdulillah", limit: 33 },
  { value: "allahuakbar", label: "Allahu Akbar", limit: 33 },
  { value: "lailaha", label: "La ilaha illallah", limit: 100 },
  { value: "astaghfirullah", label: "Astaghfirullah", limit: 100 },
  { value: "salawaat", label: "Durud / Salawat", limit: 100 },
];

export default function Tasbih() {
  const [count, setCount] = useState(() => {
    const saved = localStorage.getItem("tasbih");
    return saved !== null ? parseInt(saved, 10) || 0 : 0;
  });
  const [dhikr, setDhikr] = useState("subhanallah");
  const [isPulsing, setIsPulsing] = useState(false);

  useEffect(() => {
    localStorage.setItem("tasbih", String(count));
  }, [count]);

  const currentLimit = useMemo(
    () => DHIKR_OPTIONS.find((item) => item.value === dhikr)?.limit || 33,
    [dhikr],
  );

  const cycleCount = count % currentLimit;
  const cyclesComplete = Math.floor(count / currentLimit);
  const progress = currentLimit > 0 ? (cycleCount / currentLimit) * 100 : 0;

  const handleTap = () => {
    setCount((current) => current + 1);
    setIsPulsing(true);
    window.setTimeout(() => setIsPulsing(false), 260);
    if (navigator.vibrate) navigator.vibrate(12);
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
        <div
          style={{
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <h2 className="section-title">📿 Digital Tasbih</h2>
            <p
              style={{
                color: "var(--white-muted)",
                maxWidth: 760,
                lineHeight: 1.7,
              }}
            >
              Count your dhikr, switch between common remembrances, and see how
              many cycles you have completed.
            </p>
          </div>
          <div style={{ minWidth: 220 }}>
            <label
              style={{
                display: "block",
                marginBottom: 10,
                color: "var(--white-muted)",
              }}
            >
              Choose remembrance
            </label>
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

        <div
          className="result"
          style={{ display: "grid", gap: 18, padding: 24 }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div>
              <div style={{ color: "var(--white-muted)", marginBottom: 6 }}>
                Current dhikr
              </div>
              <strong>
                {DHIKR_OPTIONS.find((item) => item.value === dhikr)?.label}
              </strong>
            </div>
            <div>
              <div style={{ color: "var(--white-muted)", marginBottom: 6 }}>
                Cycle progress
              </div>
              <strong>
                {cycleCount} / {currentLimit}
              </strong>
            </div>
            <div>
              <div style={{ color: "var(--white-muted)", marginBottom: 6 }}>
                Total count
              </div>
              <strong>{count}</strong>
            </div>
          </div>

          <div
            style={{
              background: "rgba(255,255,255,0.06)",
              borderRadius: 9999,
              overflow: "hidden",
              height: 16,
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: "linear-gradient(90deg, #d4af37, #10b981)",
              }}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: 14,
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ color: "var(--white-muted)", marginBottom: 6 }}>
                Complete cycles
              </div>
              <strong>{cyclesComplete}</strong>
            </div>
            <div style={{ textAlign: "right" }}>
              <button
                type="button"
                onClick={handleTap}
                style={{ minWidth: 160 }}
                className={isPulsing ? "pulse" : ""}
              >
                Count Dhikr
              </button>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button type="button" onClick={resetTasbih}>
              Reset
            </button>
            <button type="button" className="danger" onClick={clearTasbih}>
              Clear All
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
