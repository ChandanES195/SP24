let audioCtx: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new Ctx();
  }
  return audioCtx;
}

export function playSignal(samples: Float32Array, Fs: number): () => void {
  stopSignal();
  const ctx = getCtx();
  // Normalize for safe playback (peak to 0.9).
  let peak = 0;
  for (let i = 0; i < samples.length; i++) {
    const v = Math.abs(samples[i]);
    if (v > peak) peak = v;
  }
  const gain = peak > 0 ? 0.9 / peak : 1;

  // If Fs below AudioContext minimum, resample by linear interp to ctx.sampleRate.
  const targetFs = Fs < 3000 ? ctx.sampleRate : Fs;
  let data: Float32Array;
  if (targetFs === Fs) {
    data = new Float32Array(samples.length);
    for (let i = 0; i < samples.length; i++) data[i] = samples[i] * gain;
  } else {
    const ratio = targetFs / Fs;
    const newLen = Math.floor(samples.length * ratio);
    data = new Float32Array(newLen);
    for (let i = 0; i < newLen; i++) {
      const src = i / ratio;
      const i0 = Math.floor(src);
      const i1 = Math.min(samples.length - 1, i0 + 1);
      const frac = src - i0;
      data[i] = (samples[i0] * (1 - frac) + samples[i1] * frac) * gain;
    }
  }

  const buf = ctx.createBuffer(1, data.length, targetFs);
  buf.copyToChannel(data as Float32Array<ArrayBuffer>, 0);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.connect(ctx.destination);
  src.start();
  currentSource = src;
  src.onended = () => {
    if (currentSource === src) currentSource = null;
  };
  if (ctx.state === "suspended") void ctx.resume();
  return stopSignal;
}

export function stopSignal() {
  if (currentSource) {
    try {
      currentSource.stop();
    } catch {
      /* ignore */
    }
    currentSource = null;
  }
}

// Encode Float32 samples to a 16-bit PCM mono WAV Blob.
export function encodeWav(samples: Float32Array, Fs: number): Blob {
  const numSamples = samples.length;
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);
  const writeStr = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + numSamples * 2, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, Fs, true);
  view.setUint32(28, Fs * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, numSamples * 2, true);
  // Normalize peak
  let peak = 0;
  for (let i = 0; i < numSamples; i++) {
    const v = Math.abs(samples[i]);
    if (v > peak) peak = v;
  }
  const g = peak > 0 ? 0.99 / peak : 1;
  let off = 44;
  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, samples[i] * g));
    view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    off += 2;
  }
  return new Blob([buffer], { type: "audio/wav" });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
