import { useState } from "react";
import { Download } from "lucide-react";
import type { Data, Layout } from "plotly.js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { downloadBlob, encodeWav } from "@/lib/audio/playback";
import type { ComputeResult } from "@/hooks/useSignalCompute";
import type { SignalId, SignalParams } from "@/lib/signals";
import { SIGNALS } from "@/lib/signals";

export interface PlotFigure {
  name: string; // file suffix
  data: Data[];
  layout: Partial<Layout>;
}

interface Props {
  result: ComputeResult;
  signalId: SignalId;
  params: SignalParams;
  figures: PlotFigure[];
}

function downloadCsv(name: string, header: string[], rows: number[][]) {
  const lines = [header.join(",")];
  for (const r of rows) lines.push(r.join(","));
  downloadBlob(new Blob([lines.join("\n")], { type: "text/csv" }), name);
}

async function downloadPlotsPng(base: string, figures: PlotFigure[]) {
  const plotlyMod = await import("plotly.js-dist-min");
  const Plotly = (plotlyMod.default ?? plotlyMod) as typeof import("plotly.js");
  for (const fig of figures) {
    const figure = {
      data: fig.data,
      layout: { ...fig.layout, paper_bgcolor: "white", plot_bgcolor: "white" },
    };
    const url = await Plotly.toImage(figure as unknown as HTMLElement, {
      format: "png",
      width: 1400,
      height: 500,
      scale: 2,
    });
    const a = document.createElement("a");
    a.href = url;
    a.download = `${base}_${fig.name}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    await new Promise((r) => setTimeout(r, 150));
  }
}

export function DownloadDialog({ result, signalId, params, figures }: Props) {
  const [open, setOpen] = useState(false);
  const [wav, setWav] = useState(true);
  const [csv, setCsv] = useState(true);
  const [paramsJson, setParamsJson] = useState(true);
  const [plotsPng, setPlotsPng] = useState(true);
  const def = SIGNALS[signalId];

  const exportAll = async () => {
    const base = `${def.id}`;
    if (wav) downloadBlob(encodeWav(result.x, result.Fs), `${base}.wav`);
    if (csv) {
      const rows: number[][] = new Array(result.t.length);
      for (let i = 0; i < result.t.length; i++) rows[i] = [result.t[i], result.x[i]];
      downloadCsv(`${base}_signal.csv`, ["t", "x"], rows);
      const rows2: number[][] = new Array(result.freq.length);
      for (let i = 0; i < result.freq.length; i++) rows2[i] = [result.freq[i], result.mag[i]];
      downloadCsv(`${base}_fft.csv`, ["f", "|P1|"], rows2);
    }
    if (paramsJson) {
      const json = JSON.stringify({ signal: def.id, params }, null, 2);
      downloadBlob(new Blob([json], { type: "application/json" }), `${base}_params.json`);
    }
    if (plotsPng) {
      await downloadPlotsPng(base, figures);
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="icon" className="h-12 w-12 rounded-full shadow-lg" title="Export signal">
          <Download className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export {def.name}</DialogTitle>
          <DialogDescription>
            Download the signal data, audio, parameters, and plot images.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <label className="flex items-center gap-3">
            <Checkbox checked={wav} onCheckedChange={(v) => setWav(!!v)} />
            <Label className="cursor-pointer">Audio (WAV, 16-bit PCM)</Label>
          </label>
          <label className="flex items-center gap-3">
            <Checkbox checked={csv} onCheckedChange={(v) => setCsv(!!v)} />
            <Label className="cursor-pointer">Signal + FFT data (CSV)</Label>
          </label>
          <label className="flex items-center gap-3">
            <Checkbox checked={paramsJson} onCheckedChange={(v) => setParamsJson(!!v)} />
            <Label className="cursor-pointer">Parameters (JSON)</Label>
          </label>
          <label className="flex items-center gap-3">
            <Checkbox checked={plotsPng} onCheckedChange={(v) => setPlotsPng(!!v)} />
            <Label className="cursor-pointer">Plots — Time + FFT + STFT (PNG)</Label>
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={exportAll}>Download</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
