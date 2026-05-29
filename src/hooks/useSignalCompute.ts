import { useEffect, useMemo, useState } from "react";
import { singleSidedSpectrum } from "@/lib/dsp/fft";
import { timeAxis } from "@/lib/dsp/generators";
import { computeSTFT, type STFTResult } from "@/lib/dsp/stft";
import { SIGNALS, type SignalId, type SignalParams, validateParams } from "@/lib/signals";

export interface ComputeResult {
  t: Float32Array;
  x: Float32Array;
  freq: Float32Array;
  mag: Float32Array;
  stft: STFTResult;
  Fs: number;
}

/**
 * Computes the signal when `params` reference changes.
 * Pair with a "commit on click" pattern in the parent so users
 * trigger work explicitly.
 */
export function useSignalCompute(id: SignalId, params: SignalParams | null) {
  const errors = useMemo(
    () => (params ? validateParams(id, params) : []),
    [id, params],
  );
  const [result, setResult] = useState<ComputeResult | null>(null);
  const [computing, setComputing] = useState(false);

  useEffect(() => {
    if (!params || errors.length > 0) {
      setResult(null);
      return;
    }
    setComputing(true);
    // Yield to the event loop so the UI can show "Computing…"
    const handle = setTimeout(() => {
      try {
        const def = SIGNALS[id];
        const t = timeAxis(params.Fs, params.duration);
        const x = def.generate(t, params, params.duration);
        const { freq, mag } = singleSidedSpectrum(x, params.Fs);
        const stft = computeSTFT(x, params.Fs);
        setResult({ t, x, freq, mag, stft, Fs: params.Fs });
      } catch (e) {
        console.error(e);
        setResult(null);
      } finally {
        setComputing(false);
      }
    }, 30);
    return () => clearTimeout(handle);
  }, [id, params, errors]);

  return { result, errors, computing };
}
