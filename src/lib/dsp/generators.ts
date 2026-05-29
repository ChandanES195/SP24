// Pure JS signal generators matching MATLAB conventions.

export function timeAxis(Fs: number, duration: number): Float32Array {
  const N = Math.floor(Fs * duration);
  const t = new Float32Array(N);
  const dt = 1 / Fs;
  for (let i = 0; i < N; i++) t[i] = i * dt;
  return t;
}

export function sineWave(t: Float32Array, f0: number, amp: number): Float32Array {
  const x = new Float32Array(t.length);
  const w = 2 * Math.PI * f0;
  for (let i = 0; i < t.length; i++) x[i] = amp * Math.sin(w * t[i]);
  return x;
}

// MATLAB square(2*pi*f0*t, duty): high for first duty% of period
export function squareWave(t: Float32Array, f0: number, duty: number, amp: number): Float32Array {
  const x = new Float32Array(t.length);
  const d = duty / 100;
  for (let i = 0; i < t.length; i++) {
    const phase = (f0 * t[i]) % 1;
    const p = phase < 0 ? phase + 1 : phase;
    x[i] = p < d ? amp : -amp;
  }
  return x;
}

// MATLAB sawtooth(2*pi*f0*t, width): triangle when width=0.5
// width=skew sets the peak position within [0,1] of the period.
export function triangleWave(t: Float32Array, f0: number, width: number, amp: number): Float32Array {
  const x = new Float32Array(t.length);
  const w = Math.min(0.999, Math.max(0.001, width));
  for (let i = 0; i < t.length; i++) {
    const phase = (f0 * t[i]) % 1;
    const p = phase < 0 ? phase + 1 : phase;
    let v: number;
    if (p < w) v = -1 + (2 * p) / w;
    else v = 1 - (2 * (p - w)) / (1 - w);
    x[i] = amp * v;
  }
  return x;
}

// Centered sinc: sinc(2*fc*(t - duration/2))
// MATLAB sinc(x) = sin(pi*x)/(pi*x)
export function sincWave(t: Float32Array, fc: number, duration: number, amp: number): Float32Array {
  const x = new Float32Array(t.length);
  const c = duration / 2;
  for (let i = 0; i < t.length; i++) {
    const arg = 2 * fc * (t[i] - c);
    const piArg = Math.PI * arg;
    x[i] = amp * (Math.abs(piArg) < 1e-12 ? 1 : Math.sin(piArg) / piArg);
  }
  return x;
}

// MATLAB chirp(t, f0, T, f1, method, phi=0). Phase formulas:
// linear:      phi + 2π(f0 t + (f1-f0)/(2T) t^2)
// quadratic:   phi + 2π(f0 t + (f1-f0)/(3 T^2) t^3)
// logarithmic: phi + 2π f0 T ((f1/f0)^(t/T) - 1) / ln(f1/f0)
export function chirpWave(
  t: Float32Array,
  f0: number,
  f1: number,
  T: number,
  method: "linear" | "quadratic" | "logarithmic",
  amp: number,
): Float32Array {
  const x = new Float32Array(t.length);
  if (method === "linear") {
    const k = (f1 - f0) / (2 * T);
    for (let i = 0; i < t.length; i++) {
      const phase = 2 * Math.PI * (f0 * t[i] + k * t[i] * t[i]);
      x[i] = amp * Math.cos(phase);
    }
  } else if (method === "quadratic") {
    const k = (f1 - f0) / (3 * T * T);
    for (let i = 0; i < t.length; i++) {
      const ti = t[i];
      const phase = 2 * Math.PI * (f0 * ti + k * ti * ti * ti);
      x[i] = amp * Math.cos(phase);
    }
  } else {
    // logarithmic — requires f0>0, f1>0, f1!=f0
    const safeF0 = Math.max(f0, 1e-6);
    const safeF1 = Math.max(f1, safeF0 * 1.0001);
    const ratio = safeF1 / safeF0;
    const lnR = Math.log(ratio);
    for (let i = 0; i < t.length; i++) {
      const phase = (2 * Math.PI * safeF0 * T * (Math.pow(ratio, t[i] / T) - 1)) / lnR;
      x[i] = amp * Math.cos(phase);
    }
  }
  return x;
}

export function nextPow2(n: number): number {
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}
