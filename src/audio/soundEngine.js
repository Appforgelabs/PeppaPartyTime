// ============================================================
//  soundEngine.js — pure Web Audio API synthesizer.
//  No external audio files: every sound is generated live with
//  oscillators, filtered noise and ADSR-style gain envelopes.
// ============================================================

let ctx = null;
let master = null;

function ensureCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.55;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// Enveloped oscillator note. `decay` covers the release tail.
function tone({ freq = 440, type = 'sine', attack = 0.005, decay = 0.4, peak = 0.3, when = 0, slideTo = null }) {
  const ac = ensureCtx();
  const t = ac.currentTime + when;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + decay);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(peak, t + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  osc.connect(gain).connect(master);
  osc.start(t);
  osc.stop(t + attack + decay + 0.05);
}

// Short burst of shaped noise (pops, puffs, shimmer).
function noise({ duration = 0.15, freq = 1200, q = 1, peak = 0.25, when = 0, slideTo = null }) {
  const ac = ensureCtx();
  const t = ac.currentTime + when;
  const len = Math.max(1, Math.floor(ac.sampleRate * duration));
  const buffer = ac.createBuffer(1, len, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(freq, t);
  if (slideTo) filter.frequency.exponentialRampToValueAtTime(slideTo, t + duration);
  filter.Q.value = q;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(peak, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  src.connect(filter).connect(gain).connect(master);
  src.start(t);
  src.stop(t + duration);
}

// ---------------- Public API ----------------

/** Soft balloon pop: quick noise burst + low thump. */
export function playPopSound() {
  noise({ duration: 0.12, freq: 900, slideTo: 300, peak: 0.35, q: 0.8 });
  tone({ freq: 500, type: 'sine', decay: 0.12, peak: 0.22, slideTo: 160 });
}

/** Crystal glockenspiel note for counting (fundamental + 3rd harmonic). */
export function playChime(frequency = 523.25) {
  tone({ freq: frequency, type: 'sine', decay: 1.1, peak: 0.28 });
  tone({ freq: frequency * 3.01, type: 'sine', decay: 0.5, peak: 0.06 });
}

/** Magical rising chord when a present opens. */
export function playUnwrapSound() {
  const notes = [261.63, 329.63, 392.0, 523.25, 659.25]; // C E G C E
  notes.forEach((f, i) => tone({ freq: f, type: 'triangle', decay: 0.5, peak: 0.2, when: i * 0.09 }));
  noise({ duration: 0.4, freq: 4000, peak: 0.05, q: 2, when: 0.1 }); // shimmer
}

/** Tiny fairy sparkle (candle blown, mode toggles). */
export function playSparkle() {
  [1567.98, 2093.0].forEach((f, i) => tone({ freq: f, type: 'sine', decay: 0.35, peak: 0.12, when: i * 0.07 }));
}

/** Soft "foosh" of air when a candle is tapped out. */
export function playBlowOut() {
  noise({ duration: 0.35, freq: 600, slideTo: 200, peak: 0.2, q: 0.6 });
}

/** Upbeat birthday fanfare with a little toy-drum groove. */
export function playCelebrationFanfare() {
  const seq = [
    [523.25, 0.0], [523.25, 0.14], [659.25, 0.28], [783.99, 0.42],
    [659.25, 0.56], [783.99, 0.7], [1046.5, 0.88],
  ];
  seq.forEach(([f, w]) => tone({ freq: f, type: 'triangle', decay: 0.35, peak: 0.22, when: w }));
  [1046.5, 1318.5, 1568.0].forEach((f, i) =>
    tone({ freq: f, type: 'sine', decay: 0.8, peak: 0.1, when: 1.1 + i * 0.1 })
  );
  [0, 0.28, 0.56, 0.84].forEach((w) => tone({ freq: 120, type: 'sine', decay: 0.12, peak: 0.25, when: w }));
}

/** Call on first user gesture so mobile browsers unlock audio. */
export function warmUpAudio() {
  ensureCtx();
}
