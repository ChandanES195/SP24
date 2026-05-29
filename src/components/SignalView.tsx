import { useMemo } from "react";
import type { Data, Layout } from "plotly.js";
import { AlertCircle, Loader2, MousePointerClick } from "lucide-react";
import { PlotCard } from "./PlotCard";
import { PlayButton } from "./PlayButton";
import { DownloadDialog } from "./DownloadDialog";
import { useSignalCompute } from "@/hooks/useSignalCompute";
import {
  SIGNALS,
  getViewBounds,
  type SignalId,
  type SignalParams,
} from "@/lib/signals";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Props {
  signalId: SignalId;
  /** Committed params — null until the user clicks Compute & Plot. */
  params: SignalParams | null;
}

export function SignalView({ signalId, params }: Props) {
  const def = SIGNALS[signalId];
  const { result, errors, computing } = useSignalCompute(signalId, params);
  const markers = params ? def.markers(params) : {};
  const bounds = params ? getViewBounds(signalId, params) : null;

  const timeData: Data[] = useMemo(() => {
    if (!result) return [];
    return [
      {
        type: "scattergl",
        mode: "lines",
        x: Array.from(result.t),
        y: Array.from(result.x),
        line: { color: def.accent, width: 1.2 },
        name: def.name,
      },
    ];
  }, [result, def.accent, def.name]);

  const fftData: Data[] = useMemo(() => {
    if (!result) return [];
    return [
      {
        type: "scattergl",
        mode: "lines",
        x: Array.from(result.freq),
        y: Array.from(result.mag),
        line: { color: "#dc2626", width: 1.2 },
        name: "|P1(f)|",
      },
    ];
  }, [result]);

  const stftData: Data[] = useMemo(() => {
    if (!result) return [];
    return [
      {
        type: "heatmap",
        x: Array.from(result.stft.T),
        y: Array.from(result.stft.F),
        z: result.stft.dB.map((r) => Array.from(r)),
        colorscale: "Jet",
        colorbar: { title: { text: "dB" }, thickness: 12 },
        zsmooth: "best",
      },
    ];
  }, [result]);

  const timeLayout: Partial<Layout> = bounds
    ? {
        xaxis: { title: { text: "Time (s)" }, range: [bounds.xStart, bounds.xEnd] },
        yaxis: { title: { text: "Amplitude" }, range: [bounds.yStart, bounds.yEnd] },
      }
    : {};

  const fftLayout: Partial<Layout> = bounds
    ? {
        xaxis: { title: { text: "Frequency (Hz)" }, range: [bounds.fStart, bounds.fEnd] },
        yaxis: { title: { text: "|P1(f)|" } },
        shapes: [
          ...(markers.f0
            ? [
                {
                  type: "line" as const,
                  x0: markers.f0,
                  x1: markers.f0,
                  y0: 0,
                  y1: 1,
                  yref: "paper" as const,
                  line: { color: "#111", width: 1.5, dash: "dash" as const },
                },
              ]
            : []),
          ...(markers.f1
            ? [
                {
                  type: "line" as const,
                  x0: markers.f1,
                  x1: markers.f1,
                  y0: 0,
                  y1: 1,
                  yref: "paper" as const,
                  line: { color: "#111", width: 1.5, dash: "dash" as const },
                },
              ]
            : []),
        ],
        annotations: [
          ...(markers.f0
            ? [
                {
                  x: markers.f0,
                  y: 1,
                  yref: "paper" as const,
                  text: `f₀ = ${markers.f0.toPrecision(4)} Hz`,
                  showarrow: false,
                  font: { color: "#111", size: 10 },
                  xanchor: "left" as const,
                },
              ]
            : []),
          ...(markers.f1
            ? [
                {
                  x: markers.f1,
                  y: 0.92,
                  yref: "paper" as const,
                  text: `f₁ = ${markers.f1.toPrecision(4)} Hz`,
                  showarrow: false,
                  font: { color: "#111", size: 10 },
                  xanchor: "left" as const,
                },
              ]
            : []),
        ],
      }
    : {};

  const stftLayout: Partial<Layout> = bounds && params
    ? {
        xaxis: { title: { text: "Time (s)" }, range: [0, params.duration] },
        yaxis: { title: { text: "Frequency (Hz)" }, range: [0, bounds.stftYMax] },
        shapes: [
          ...(markers.f0
            ? [
                {
                  type: "line" as const,
                  x0: 0,
                  x1: 1,
                  xref: "paper" as const,
                  y0: markers.f0,
                  y1: markers.f0,
                  line: { color: "#111", width: 1.2, dash: "dash" as const },
                },
              ]
            : []),
          ...(markers.f1
            ? [
                {
                  type: "line" as const,
                  x0: 0,
                  x1: 1,
                  xref: "paper" as const,
                  y0: markers.f1,
                  y1: markers.f1,
                  line: { color: "#111", width: 1.2, dash: "dash" as const },
                },
              ]
            : []),
        ],
      }
    : {};

  if (!params) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div
          className="flex max-w-md flex-col items-center gap-3 rounded-xl border-2 border-dashed p-10 text-center"
          style={{ borderColor: `${def.accent}55` }}
        >
          <div
            className="rounded-full p-4"
            style={{ background: `${def.accent}22`, color: def.accent }}
          >
            <MousePointerClick className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-semibold">Ready to analyze {def.name}</h3>
          <p className="text-sm text-muted-foreground">
            Adjust parameters in the sidebar, then click{" "}
            <span className="font-medium" style={{ color: def.accent }}>
              Compute &amp; Plot
            </span>{" "}
            to generate the time, FFT, and STFT views — and unlock audio
            playback for this signal.
          </p>
        </div>
      </div>
    );
  }

  if (errors.length > 0) {
    return (
      <div className="space-y-2">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Fix parameters to compute</AlertTitle>
          <AlertDescription>
            <ul className="list-inside list-disc text-sm">
              {errors.map((e) => (
                <li key={e.key}>{e.message}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="relative space-y-4 pb-24">
      {computing && !result && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Computing…
        </div>
      )}
      {result && (
        <>
          <PlotCard
            title="Time Domain"
            data={timeData}
            layout={timeLayout}
            filename={`${def.id}_time`}
          />
          <PlotCard
            title="Single-Sided Amplitude Spectrum (FFT)"
            data={fftData}
            layout={fftLayout}
            filename={`${def.id}_fft`}
          />
          <PlotCard
            title="STFT Magnitude (dB)"
            data={stftData}
            layout={stftLayout}
            filename={`${def.id}_stft`}
            height={320}
          />
        </>
      )}

      <div className="pointer-events-none fixed bottom-6 right-6 z-30 flex items-end gap-3">
        {result && (
          <div className="pointer-events-auto">
            <DownloadDialog
              result={result}
              signalId={signalId}
              params={params}
              figures={[
                { name: "time", data: timeData, layout: timeLayout },
                { name: "fft", data: fftData, layout: fftLayout },
                { name: "stft", data: stftData, layout: stftLayout },
              ]}
            />
          </div>
        )}
        <div className="pointer-events-auto">
          <PlayButton samples={result?.x} Fs={params.Fs} accent={def.accent} />
        </div>
      </div>
    </div>
  );
}
