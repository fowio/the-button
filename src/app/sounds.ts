// ─── Sound synthesizer (Web Audio API — no files required) ──────────────────

let _ctx: AudioContext | null = null;

function ctx(): AudioContext {
  if (!_ctx) _ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}

const now = () => ctx().currentTime;

/** Oscillator tone with optional frequency glide */
function osc(
  freq: number, type: OscillatorType,
  start: number, dur: number, vol: number,
  freqEnd?: number,
) {
  const ac = ctx();
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, start);
  if (freqEnd !== undefined) o.frequency.exponentialRampToValueAtTime(freqEnd, start + dur);
  g.gain.setValueAtTime(vol, start);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g); g.connect(ac.destination);
  o.start(start); o.stop(start + dur + 0.05);
}

/** White-noise burst */
function noise(start: number, dur: number, vol: number) {
  const ac = ctx();
  const buf = ac.createBuffer(1, Math.ceil(ac.sampleRate * dur), ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  const g = ac.createGain();
  src.buffer = buf;
  g.gain.setValueAtTime(vol, start);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  src.connect(g); g.connect(ac.destination);
  src.start(start);
}

// ─── Exported sounds ─────────────────────────────────────────────────────────

export const sounds = {

  /** Satisfying mechanical button press */
  click() {
    const s = now();
    noise(s, 0.025, 0.22);
    osc(140, 'sine', s, 0.07, 0.45, 50);
  },

  /** Classic blaring airhorn */
  airhorn() {
    const s = now();
    osc(233,  'sawtooth', s, 2.4, 0.38);
    osc(116,  'sawtooth', s, 2.4, 0.22);
    osc(349,  'sawtooth', s, 2.4, 0.14);
  },

  /** Tick per countdown number; pass true for zero */
  countdownTick(isZero = false) {
    const s = now();
    osc(isZero ? 210 : 460, 'sine', s, isZero ? 0.28 : 0.07, isZero ? 0.5 : 0.35);
  },

  /** Anticlimactic deflating bwomp */
  countdownEnd() {
    osc(320, 'sine', now(), 1.3, 0.32, 55);
  },

  /** Accelerating snare-like drumroll */
  drumroll(dur = 0.75) {
    const s = now();
    const BEATS = 36;
    for (let i = 0; i < BEATS; i++) {
      const progress = i / BEATS;
      // interval shrinks as we go (accelerando)
      const offset = dur * (1 - Math.pow(1 - progress, 1.6));
      noise(s + offset, 0.022, 0.12 + progress * 0.14);
    }
  },

  /** Ascending 4-note fanfare */
  fanfare() {
    [261.63, 329.63, 392.00, 523.25].forEach((f, i) => {
      const s = now() + i * 0.13;
      osc(f, 'triangle', s, 0.5, 0.3);
      osc(f * 2, 'sine', s, 0.25, 0.1);
    });
  },

  /** Windows XP-style descending error chord */
  xpError() {
    const s = now();
    [659, 523, 440, 349].forEach((f, i) => osc(f, 'sine', s + i * 0.14, 0.11, 0.28));
  },

  /** Deep bass "bruh" thud */
  bruh() {
    const s = now();
    osc(78,  'sawtooth', s, 0.65, 0.45, 48);
    osc(52,  'sine',     s, 0.65, 0.28, 38);
  },

  /** Rising boom for growing button */
  grow() {
    osc(38, 'sawtooth', now(), 2.8, 0.32, 720);
  },

  /** Quick whoosh (flip / runaway) */
  whoosh() {
    const s = now();
    osc(650, 'sine', s, 0.45, 0.18, 55);
    noise(s, 0.38, 0.13);
  },

  /** Tilt + impact for gravity malfunction */
  tiltFall() {
    const s = now();
    osc(280, 'sawtooth', s, 1.1, 0.20, 28);
    noise(s + 1.0, 0.25, 0.32);  // thud on landing
  },

  /** Descending squeak for shrink ray */
  shrink() {
    osc(720, 'sine', now(), 0.48, 0.28, 75);
  },

  /** Power-down hum for lights out */
  darken() {
    osc(110, 'sine', now(), 1.9, 0.32, 12);
  },

  /** Shimmery disappear for invisible cursor */
  shimmer() {
    [1400, 1820, 2260, 1600, 2050, 2500].forEach((f, i) =>
      osc(f, 'sine', now() + i * 0.06, 0.12, 0.14)
    );
  },

  /** Quick pop; pitch optional */
  pop(pitch = 300) {
    const s = now();
    osc(pitch, 'sine', s, 0.07, 0.38, pitch * 0.38);
    noise(s, 0.035, 0.09);
  },

  /** Rainbow sparkle arpeggio */
  sparkle() {
    [1046, 1318, 1567, 2093, 2637].forEach((f, i) =>
      osc(f, 'sine', now() + i * 0.07, 0.18, 0.17)
    );
  },

  /** Escalating "hmm" per Are-You-Sure depth */
  sure(depth: number) {
    const freqs = [290, 370, 460, 560, 700];
    osc(freqs[depth - 1] ?? 290, 'sine', now(), 0.32, 0.28);
  },

  /** 3-note success ding for slider completion */
  sliderSuccess() {
    [523, 659, 784].forEach((f, i) => osc(f, 'triangle', now() + i * 0.1, 0.42, 0.28));
  },

  /** Pitter-patter rain drops */
  rain() {
    const s = now();
    for (let i = 0; i < 14; i++) {
      noise(s + Math.random() * 0.6, 0.06, 0.07 + Math.random() * 0.07);
    }
  },

  /** Eerie floating hum for existential crisis */
  existential() {
    const s = now();
    osc(170 + Math.random() * 20, 'sine', s, 0.9, 0.1, 160 + Math.random() * 15);
  },

  /** Clone "bloop" */
  clonePop() {
    const f = 200 + Math.random() * 250;
    osc(f, 'sine', now(), 0.09, 0.3, f * 0.35);
  },

  /** Cheesy pizza ding */
  pizzaDing() {
    const s = now();
    osc(880, 'sine', s, 0.18, 0.22);
    osc(1108, 'sine', s + 0.08, 0.14, 0.15);
  },

  /** Drill-style bass stab for the 67 easter egg */
  sixty7() {
    const s = now();
    // Sub-bass thud
    osc(52,  'sine',     s,         0.6,  0.80, 22);
    osc(104, 'sawtooth', s,         0.12, 0.45);
    // Two snare hits
    noise(s + 0.09,  0.075, 0.52);
    osc(185, 'sine', s + 0.09,  0.05, 0.18, 60);
    noise(s + 0.205, 0.060, 0.36);
    osc(165, 'sine', s + 0.205, 0.04, 0.12, 55);
    // Two-note pitched stab (minor 3rd, very drill)
    osc(147, 'sawtooth', s + 0.02,  0.09, 0.30);
    osc(175, 'sawtooth', s + 0.145, 0.08, 0.26);
    // Hi-hat ticks
    noise(s,         0.018, 0.18);
    noise(s + 0.10,  0.015, 0.14);
    noise(s + 0.205, 0.015, 0.12);
  },

  /** Achievement unlock chime */
  achievement() {
    const s = now();
    [523, 659, 784, 1046].forEach((f, i) => {
      osc(f, 'triangle', s + i * 0.09, 0.38, 0.22);
      osc(f * 2, 'sine',   s + i * 0.09, 0.16, 0.10);
    });
  },
};