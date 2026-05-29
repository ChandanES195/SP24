import FFT from "fft.js";
import { nextPow2 } from "./generators";

export interface STFTResult {
  T: Float32Array; // frame center times (s)
  F: Float32Array; // freq bins (Hz)
  dB: Float32Array[]; // dB matrix [freqBin][frame]
}

// Periodic Hann window of length L
function hannPeriodic(L: number): Float32Array {
  const w = new Float32Array(L);
  for (let i = 0; i < L; i++) w[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / L));
  return w;
}

export function computeSTFT(x: ArrayLike<number>, Fs: number): STFTResult {
  const winLen = Math.max(64, nextPow2(Math.round(0.032 * Fs)));
  const overlap = Math.round(0.75 * winLen);
  const hop = winLen - overlap;
  const fftLen = Math.max(512, nextPow2(4 * winLen));
  const win = hannPeriodic(winLen);

  const N = x.length;
  const nFrames = Math.floor((N - winLen) / hop) + 1;
  if (nFrames <= 0) {
    return { T: new Float32Array(0), F: new Float32Array(0), dB: [] };
  }

  const fft = new FFT(fftLen);
  const input = fft.createComplexArray();
  const out = fft.createComplexArray();
  const half = fftLen / 2 + 1;

  const F = new Float32Array(half);
  for (let i = 0; i < half; i++) F[i] = (Fs * i) / fftLen;

  const T = new Float32Array(nFrames);
  // Pre-allocate dB rows
  const dB: Float32Array[] = new Array(half);
  for (let k = 0; k < half; k++) dB[k] = new Float32Array(nFrames);

  for (let frame = 0; frame < nFrames; frame++) {
    const start = frame * hop;
    T[frame] = (start + winLen / 2) / Fs;
    for (let i = 0; i < fftLen; i++) {
      input[2 * i] = i < winLen ? (x[start + i] as number) * win[i] : 0;
      input[2 * i + 1] = 0;
    }
    fft.transform(out, input);
    for (let k = 0; k < half; k++) {
      const re = out[2 * k];
      const im = out[2 * k + 1];
      const mag = Math.sqrt(re * re + im * im) + 1e-12;
      dB[k][frame] = 20 * Math.log10(mag);
    }
  }

  return { T, F, dB };
}
