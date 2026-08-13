// Generate a page-turn sound effect using Web Audio API
export function playPageTurnSound() {
  try {
    const audioContext = new (
      window.AudioContext || window.webkitAudioContext
    )();

    // Create nodes for the page-turn sound effect
    const now = audioContext.currentTime;
    const duration = 0.3;

    // Create a low-frequency "whoosh" sound
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.connect(gain);
    gain.connect(audioContext.destination);

    // Start at a higher frequency and quickly drop (like a page turning)
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + duration * 0.3);
    osc.frequency.exponentialRampToValueAtTime(50, now + duration);

    // Create envelope: fade in quickly then fade out
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    osc.start(now);
    osc.stop(now + duration);

    // Add a high-frequency "click" for the page snap
    const clickOsc = audioContext.createOscillator();
    const clickGain = audioContext.createGain();

    clickOsc.connect(clickGain);
    clickGain.connect(audioContext.destination);

    clickOsc.frequency.setValueAtTime(800, now + duration * 0.2);
    clickOsc.frequency.exponentialRampToValueAtTime(400, now + duration);

    clickGain.gain.setValueAtTime(0, now + duration * 0.2);
    clickGain.gain.linearRampToValueAtTime(0.08, now + duration * 0.3);
    clickGain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    clickOsc.start(now + duration * 0.2);
    clickOsc.stop(now + duration);
  } catch (error) {
    // Silently fail if Web Audio API is not available
    console.debug("Page turn sound unavailable:", error);
  }
}

// Disable audio context suspension if needed
export function initAudioContext() {
  try {
    const audioContext = new (
      window.AudioContext || window.webkitAudioContext
    )();
    if (audioContext.state === "suspended") {
      document.addEventListener("click", () => {
        audioContext.resume();
      });
    }
  } catch (error) {
    // Web Audio API not available
  }
}

// Generate a bead tap sound effect using Web Audio API
export function playBeadTapSound() {
  try {
    const audioContext = new (
      window.AudioContext || window.webkitAudioContext
    )();

    const now = audioContext.currentTime;
    const duration = 0.15; // Short bead click

    // Create primary bead click - bright, crisp tone
    const osc1 = audioContext.createOscillator();
    const gain1 = audioContext.createGain();

    osc1.connect(gain1);
    gain1.connect(audioContext.destination);

    // High-frequency bright bead click
    osc1.frequency.setValueAtTime(1200, now);
    osc1.frequency.exponentialRampToValueAtTime(800, now + duration);

    // Quick attack, quick decay
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.3, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.05, now + duration * 0.6);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + duration);

    osc1.start(now);
    osc1.stop(now + duration);

    // Add a subtle resonance - second harmonic
    const osc2 = audioContext.createOscillator();
    const gain2 = audioContext.createGain();

    osc2.connect(gain2);
    gain2.connect(audioContext.destination);

    // Lower harmonic for depth
    osc2.frequency.setValueAtTime(600, now);
    osc2.frequency.exponentialRampToValueAtTime(400, now + duration);

    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(0.15, now + 0.02);
    gain2.gain.exponentialRampToValueAtTime(0.02, now + duration * 0.7);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc2.start(now);
    osc2.stop(now + duration);
  } catch (error) {
    // Silently fail if Web Audio API is not available
    console.debug("Bead tap sound unavailable:", error);
  }
}
