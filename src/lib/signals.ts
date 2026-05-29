// Signal registry: params, defaults, validation ranges, generation,
// auto sample-rate, and MATLAB-style view bounds.
import {
  chirpWave,
  sincWave,
  sineWave,
  squareWave,
  triangleWave,
} from "./dsp/generators";

export type SignalId =
  | "sine"
  | "square"
  | "triangle"
  | "linchirp"
  | "quadchirp"
  | "logchirp"
  | "sinc";

export interface ParamDef {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  default: number;
  unit?: string;
}

export interface SignalDef {
  id: SignalId;
  name: string;
  shortName: string;
  isChirp: boolean;
  /** A vibrant accent color (hex) used in plots and tabs. */
  accent: string;
  params: ParamDef[];
  defaults: {
    Fs: number;
    duration: number;
    amplitude: number;
    cycles: number;
  };
  generate: (t: Float32Array, p: Record<string, number>, duration: number) => Float32Array;
  markers: (p: Record<string, number>) => { f0?: number; f1?: number };
  /** Maximum frequency present in the signal. */
  maxFreq: (p: Record<string, number>) => number;
}

const commonDefaults = { Fs: 44100, duration: 5, amplitude: 1, cycles: 10 };

export const SIGNALS: Record<SignalId, SignalDef> = {
  sine: {
    id: "sine",
    name: "Sine",
    shortName: "Sine",
    isChirp: false,
    accent: "#3b82f6",
    params: [
      { key: "f0", label: "Frequency f₀", min: 1, max: 4000, step: 0.5, default: 37.5, unit: "Hz" },
    ],
    defaults: commonDefaults,
    generate: (t, p) => sineWave(t, p.f0, p.amplitude),
    markers: (p) => ({ f0: p.f0 }),
    maxFreq: (p) => p.f0,
  },
  square: {
    id: "square",
    name: "Square Wave",
    shortName: "Square",
    isChirp: false,
    accent: "#f59e0b",
    params: [
      { key: "f0", label: "Frequency f₀", min: 1, max: 4000, step: 0.5, default: 37.5, unit: "Hz" },
      { key: "duty", label: "Duty cycle", min: 1, max: 99, step: 1, default: 50, unit: "%" },
    ],
    defaults: commonDefaults,
    generate: (t, p) => squareWave(t, p.f0, p.duty, p.amplitude),
    markers: (p) => ({ f0: p.f0 }),
    maxFreq: (p) => p.f0,
  },
  triangle: {
    id: "triangle",
    name: "Triangle",
    shortName: "Triangle",
    isChirp: false,
    accent: "#10b981",
    params: [
      { key: "f0", label: "Frequency f₀", min: 1, max: 4000, step: 0.5, default: 37.5, unit: "Hz" },
      { key: "skew", label: "Duty skew", min: 1, max: 99, step: 1, default: 50, unit: "%" },
    ],
    defaults: commonDefaults,
    generate: (t, p) => triangleWave(t, p.f0, p.skew / 100, p.amplitude),
    markers: (p) => ({ f0: p.f0 }),
    maxFreq: (p) => p.f0,
  },
  linchirp: {
    id: "linchirp",
    name: "Linear Chirp",
    shortName: "Lin Chirp",
    isChirp: true,
    accent: "#ec4899",
    params: [
      { key: "f0", label: "Start frequency f₀", min: 1, max: 4000, step: 1, default: 100, unit: "Hz" },
      { key: "f1", label: "End frequency f₁", min: 1, max: 4000, step: 1, default: 1000, unit: "Hz" },
    ],
    defaults: commonDefaults,
    generate: (t, p, d) => chirpWave(t, p.f0, p.f1, d, "linear", p.amplitude),
    markers: (p) => ({ f0: p.f0, f1: p.f1 }),
    maxFreq: (p) => Math.max(p.f0, p.f1),
  },
  quadchirp: {
    id: "quadchirp",
    name: "Quadratic Chirp",
    shortName: "Quad Chirp",
    isChirp: true,
    accent: "#a855f7",
    params: [
      { key: "f0", label: "Start frequency f₀", min: 1, max: 4000, step: 1, default: 50, unit: "Hz" },
      { key: "f1", label: "End frequency f₁", min: 1, max: 4000, step: 1, default: 800, unit: "Hz" },
    ],
    defaults: commonDefaults,
    generate: (t, p, d) => chirpWave(t, p.f0, p.f1, d, "quadratic", p.amplitude),
    markers: (p) => ({ f0: p.f0, f1: p.f1 }),
    maxFreq: (p) => Math.max(p.f0, p.f1),
  },
  logchirp: {
    id: "logchirp",
    name: "Logarithmic Chirp",
    shortName: "Log Chirp",
    isChirp: true,
    accent: "#06b6d4",
    params: [
      { key: "f0", label: "Start frequency f₀", min: 1, max: 4000, step: 1, default: 20, unit: "Hz" },
      { key: "f1", label: "End frequency f₁", min: 2, max: 4000, step: 1, default: 2000, unit: "Hz" },
    ],
    defaults: commonDefaults,
    generate: (t, p, d) => chirpWave(t, p.f0, p.f1, d, "logarithmic", p.amplitude),
    markers: (p) => ({ f0: p.f0, f1: p.f1 }),
    maxFreq: (p) => Math.max(p.f0, p.f1),
  },
  sinc: {
    id: "sinc",
    name: "Sinc",
    shortName: "Sinc",
    isChirp: false,
    accent: "#ef4444",
    params: [
      { key: "fc", label: "Center frequency f_c", min: 1, max: 4000, step: 1, default: 50, unit: "Hz" },
    ],
    defaults: commonDefaults,
    generate: (t, p, d) => sincWave(t, p.fc, d, p.amplitude),
    markers: (p) => ({ f0: p.fc }),
    maxFreq: (p) => p.fc,
  },
};

export const SIGNAL_ORDER: SignalId[] = [
  "sine",
  "square",
  "triangle",
  "linchirp",
  "quadchirp",
  "logchirp",
  "sinc",
];

export interface SignalParams {
  Fs: number;
  duration: number;
  amplitude: number;
  cycles: number;
  [k: string]: number;
}

export function defaultParamsFor(id: SignalId): SignalParams {
  const def = SIGNALS[id];
  const p: SignalParams = { ...def.defaults };
  def.params.forEach((pd) => (p[pd.key] = pd.default));
  p.Fs = getFs(id, p);
  return p;
}

/** Fs = max(44100, ceil(38 · maxFreq)) — matches MATLAB SignalGenAnalyz. */
export function getFs(id: SignalId, p: SignalParams): number {
  const maxF = Math.max(SIGNALS[id].maxFreq(p), 1);
  return Math.max(44100, Math.ceil(38 * maxF));
}

export interface ViewBounds {
  xStart: number;
  xEnd: number;
  yStart: number;
  yEnd: number;
  fStart: number;
  fEnd: number;
  stftYMax: number;
  Fs: number;
}

/** MATLAB-style view bounds for Time / FFT / STFT plots. */
export function getViewBounds(id: SignalId, p: SignalParams): ViewBounds {
  const def = SIGNALS[id];
  const maxF = Math.max(def.maxFreq(p), 1);
  const a = p.amplitude;
  const dur = p.duration;
  const Fs = getFs(id, p);
  const cycles = def.isChirp ? 2 * (p.f1 ?? maxF) : p.cycles;

  let xStart = 0;
  let xEnd = Math.min(cycles / maxF, dur / 2);
  let yStart = -1.1 * a;
  let yEnd = 1.1 * a;
  let fStart = 0;
  let fEnd = 1.2 * maxF;

  if (id === "sinc") {
    xEnd = dur / 2 + cycles / maxF;
    xStart = dur / 2 - cycles / maxF;
    yEnd = 1.2 * a;
    yStart = -0.5 * a;
  } else if (!def.isChirp) {
    const f0 = p.f0;
    fEnd = f0 + 100;
    fStart = Math.max(0, f0 - 100);
  }

  const stftYMax = Math.max(Math.min(2 * maxF, Fs / 2), 1000);
  return { xStart, xEnd, yStart, yEnd, fStart, fEnd, stftYMax, Fs };
}

export interface ValidationError {
  key: string;
  message: string;
}

export function validateParams(id: SignalId, p: SignalParams): ValidationError[] {
  const errs: ValidationError[] = [];
  const def = SIGNALS[id];
  const checkRange = (
    key: string,
    label: string,
    min: number,
    max: number,
    val: number | undefined,
  ) => {
    if (val === undefined || Number.isNaN(val)) {
      errs.push({ key, message: `${label} is required` });
    } else if (val < min || val > max) {
      errs.push({ key, message: `${label} must be between ${min} and ${max}` });
    }
  };
  checkRange("duration", "Duration", 0.1, 30, p.duration);
  checkRange("amplitude", "Amplitude", 0, 1, p.amplitude);
  if (!def.isChirp) checkRange("cycles", "Cycles", 1, 1000, p.cycles);
  def.params.forEach((pd) => checkRange(pd.key, pd.label, pd.min, pd.max, p[pd.key]));
  if (id === "logchirp" && p.f0 !== undefined && p.f1 !== undefined && p.f1 <= p.f0) {
    errs.push({ key: "f1", message: "End frequency must be greater than start" });
  }
  return errs;
}
