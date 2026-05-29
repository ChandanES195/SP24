# Signal Analyzer Web App — Plan

A React + TanStack Start web app replicating your MATLAB script: 7 signals in tabs, each showing Time / FFT / STFT plots, with a sidebar variable manager, zoom, per-plot PNG download, and a Play button to audition the sound.

## Tabs (one per signal)

1. Sine
2. Square
3. Triangle
4. Linear Chirp
5. Quadratic Chirp
6. Logarithmic Chirp
7. Sinc

## Layout

```text
┌─────────────────────────────────────────────────────────┐
│ Header: title + SidebarTrigger                          │
├──────────────┬──────────────────────────────────────────┤
│ Sidebar      │ Tabs: [Sine][Square][Tri][LinChirp]...   │
│  Variable    │ ┌──────────────────────────────────────┐ │
│  Manager     │ │ Time-domain plot       [⤓ SVG]       │ │
│  (controls   │ ├──────────────────────────────────────┤ │
│   for active │ │ FFT single-sided       [⤓ SVG]       │ │
│   signal)    │ ├──────────────────────────────────────┤ │
│              │ │ STFT spectrogram (dB)  [⤓ SVG]       │ │
│              │ └──────────────────────────────────────┘ │
│              │                             ▶ Play btn  │
└──────────────┴──────────────────────────────────────────┘

## ▶ Play btn should be popped like Whatsapp call button
```

## Variable Manager (sidebar, per active signal)

Dynamic Variable as per active signal

Common (always): Sample rate Fs (default 8000 Hz, 38*MaxFrequency present in signal), Duration (default 5 s), Amplitude (0–1), Cycles (default 10).

Per signal:

- Sine : Frequency f0 (default 37.5 Hz)
- Square: Frequency f0 + Duty cycle (%)
-  Triangle: Frequency f0 + Duty skew (%)
- Sinc: Center frequency fc (default 50 Hz)
- Linear / Quadratic / Logarithmic Chirp: f_start, f_end (defaults from MATLAB code)

Sliders + numeric inputs (wire), debounced recompute. (Error throw when somthing outnound is enterd )

final computing should be blocked until all variable values entered by user in range mentioned in matlab

## Plots

- Library: **Plotly.js** (`react-plotly.js`) — built-in box/wheel zoom, pan, autoscale, and a native "Download as SVG" button (toImage). Handles heatmap for STFT.
- Time plot: x = t, y = x(t); initial xlim = min(0.1, duration) for chirp min(cycles/freq,duration), full-range via zoom.
- FFT plot: single-sided amplitude spectrum with vertical markers for f0 / f1.
- STFT plot: heatmap of magnitude in dB; horizontal markers for f0 / f1; colorscale = "Jet".
- Each plot has its own "Download PNG" button (uses Plotly.toImage); zoom is native.

## DSP (all client-side, in a Web Worker to keep UI responsive)

- Signal generation: pure JS implementations of sine, square, triangle (sawtooth width 0.5), sinc, and chirp (linear / quadratic / logarithmic phase formulas matching MATLAB's `chirp`).
- FFT: `fft.js` package (radix-2, real input wrapper). Compute `nfft = nextPow2(N)`, single-sided spectrum, double interior bins, scale by N.
- STFT: manual framing — Hann window (periodic), winLen = nextPow2(0.032·Fs) clamped ≥64, 75% overlap, fftLen = max(512, nextPow2(4·winLen)); magnitude → dB via `20·log10(|S|+eps)`.
- Worker contract: post `{signalType, params}` → worker returns `{t, x, freq, P1, stftT, stftF, stftDb}`.

## Audio Playback

- Right-bottom floating Play/Stop button per tab.
- Build an `AudioBuffer` at Fs (or upsample to context rate via linear interp), fill with generated samples (normalized to [-1, 1] × amplitude), play via `AudioBufferSourceNode`.
- Square/sine very-low-frequency signals (37.5 Hz) are audible but quiet — apply soft normalization; show a small note when fundamental is below 50 Hz.

## File / route structure

```text
src/
  routes/
    index.tsx                  # main page with sidebar + tabs
  components/
    AppSidebar.tsx             # variable manager
    SignalTabs.tsx             # tab list + content
    SignalView.tsx             # 3 plots + play button for one signal
    PlotCard.tsx               # wraps Plotly + download button
    PlayButton.tsx
  lib/
    dsp/
      generators.ts            # sine/square/triangle/sinc/chirp
      fft.ts                   # fft.js wrapper, single-sided spectrum
      stft.ts                  # framing + hann + fft → dB matrix
      window.ts                # hann periodic
    audio/playback.ts          # WebAudio helpers
    signals.ts                 # signal registry (name, defaults, param schema)
  workers/
    dsp.worker.ts              # runs generators + FFT + STFT off main thread
  hooks/
    useSignalCompute.ts        # posts params to worker, returns memoized results
```

## Dependencies to add

- `plotly.js-dist-min` + `react-plotly.js`
- `fft.js`
- (shadcn) `sidebar`, `tabs`, `slider`, `input`, `label`, `button`, `card` — install via shadcn if not already present.

## Android packaging note (informational)

The app stays a static SPA-friendly React build, so it can later be wrapped with **Capacitor** (`@capacitor/core` + Android platform) without code changes. WebAudio + Plotly work inside the Android WebView. No native plugins required for this scope.

## Technical details

- All DSP runs in the browser; no backend, no Lovable Cloud.
- Web Worker prevents 5 s × 8 kHz = 40 000-sample FFT/STFT from blocking input while sliders move; debounce param changes ~150 ms before posting.
- Default Fs = 8000 keeps STFT matrix small (~200 frames × 256 bins) — fast in JS.
- STFT downsamples the time axis in the heatmap if frames > 500 to keep Plotly snappy.
- Plotly's modebar provides zoom/pan/reset; we add a custom "Download PNG" button per plot that calls `Plotly.toImage(gd, {format:'png', width:1200, height:400})` and triggers a download.
- Color tokens stay in `src/styles.css`; Plotly plots use CSS variables read via `getComputedStyle` for axis/text colors so light/dark theming works.

## Out of scope (ask if needed)

- Saving/loading parameter presets (okay)
- Exporting raw signal as WAV (yes add one popup to dowload signal+plots for signal that tab is opened)
- Multi-signal overlay comparison  (add one option to check thi in tabular form)

&nbsp;

**Checks of Working**

- Check time domain plot of the square,sin,triangle,sinc is woring correctly with different specs or not
- check for rest signals
- check fft behaviour is correct for these signals or not as checked foe time domain
- do same for stft

**RecTify Errors**