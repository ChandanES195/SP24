import FFT from "fft.js";
import { nextPow2 } from "./generators";

export interface SpectrumResult {
  freq: Float32Array;
  mag: Float32Array; // single-sided amplitude
}

// Single-sided amplitude spectrum, MATLAB-style.
export function singleSidedSpectrum(x: ArrayLike<number>, Fs: number): SpectrumResult {
  const N = x.length;
  const nfft = nextPow2(N);
  const fft = new FFT(nfft);
  const input = fft.createComplexArray();
  // zero-pad
  for (let i = 0; i < nfft; i++) {
    input[2 * i] = i < N ? x[i] : 0;
    input[2 * i + 1] = 0;
  }
  const out = fft.createComplexArray();
  fft.transform(out, input);

  const half = nfft / 2 + 1;
  const mag = new Float32Array(half);
  const freq = new Float32Array(half);
  for (let i = 0; i < half; i++) {
    const re = out[2 * i];
    const im = out[2 * i + 1];
    let v = Math.sqrt(re * re + im * im) / N;
    if (i > 0 && i < half - 1) v *= 2;
    mag[i] = v;
    freq[i] = (Fs * i) / nfft;
  }
  return { freq, mag };
}
