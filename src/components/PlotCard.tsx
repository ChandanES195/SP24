import { useEffect, useRef, useState } from "react";
import type { Data, Layout, PlotlyHTMLElement } from "plotly.js";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useIsDark } from "@/hooks/useTheme";


interface PlotCardProps {
  title: string;
  data: Data[];
  layout: Partial<Layout>;
  filename: string;
  height?: number;
}

// Lazy-loaded refs to Plotly (client only — avoid SSR crash).
type PlotlyModule = typeof import("plotly.js");
type ReactPlotlyFactory = (plotly: unknown) => React.ComponentType<Record<string, unknown>>;
let plotlyPromise: Promise<{ Plot: React.ComponentType<Record<string, unknown>>; Plotly: PlotlyModule }> | null = null;
function getPlotly() {
  if (!plotlyPromise) {
    plotlyPromise = Promise.all([
      import("plotly.js-dist-min"),
      import("react-plotly.js/factory"),
    ]).then(([plotlyMod, factoryMod]) => {
      const Plotly = (plotlyMod.default ?? plotlyMod) as PlotlyModule;
      const createPlotly = (factoryMod.default ?? factoryMod) as ReactPlotlyFactory;
      const Plot = createPlotly(Plotly) as unknown as React.ComponentType<Record<string, unknown>>;
      return { Plot, Plotly };
    });
  }
  return plotlyPromise;
}

export function PlotCard({ title, data, layout, filename, height = 280 }: PlotCardProps) {
  const isDark = useIsDark();
  const ref = useRef<PlotlyHTMLElement | null>(null);
  const [mod, setMod] = useState<{ Plot: React.ComponentType<Record<string, unknown>>; Plotly: PlotlyModule } | null>(null);

  useEffect(() => {
    let cancel = false;
    getPlotly().then((m) => {
      if (!cancel) setMod(m);
    });
    return () => {
      cancel = true;
    };
  }, []);

  const handleDownload = async () => {
    if (!ref.current || !mod) return;
    const url = await mod.Plotly.toImage(ref.current, {
      format: "png",
      width: 1400,
      height: 500,
      scale: 2,
    });
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const gridColor = isDark ? "rgba(200,200,210,0.08)" : "rgba(120,120,120,0.2)";
  const zeroColor = isDark ? "rgba(200,200,210,0.18)" : "rgba(120,120,120,0.4)";
  const fontColor = isDark ? "#e5e7eb" : "#111827";

  const mergedLayout: Partial<Layout> = {
    autosize: true,
    margin: { l: 60, r: 30, t: 10, b: 45 },
    paper_bgcolor: "transparent",
    plot_bgcolor: "transparent",
    font: { color: fontColor, family: "inherit", size: 11 },
    xaxis: { gridcolor: gridColor, zerolinecolor: zeroColor, linecolor: zeroColor },
    yaxis: { gridcolor: gridColor, zerolinecolor: zeroColor, linecolor: zeroColor },
    ...layout,
  };


  const Plot = mod?.Plot;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Button variant="ghost" size="sm" onClick={handleDownload} title="Download PNG" disabled={!mod}>
          <Download className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {Plot ? (
          <Plot
            data={data}
            layout={mergedLayout}
            style={{ width: "100%", height }}
            useResizeHandler
            config={{
              displaylogo: false,
              responsive: true,
              scrollZoom: true,
              modeBarButtonsToRemove: ["lasso2d", "select2d"],
            }}
            onInitialized={(_fig: unknown, gd: PlotlyHTMLElement) => (ref.current = gd)}
            onUpdate={(_fig: unknown, gd: PlotlyHTMLElement) => (ref.current = gd)}
          />
        ) : (
          <div style={{ height }} className="flex items-center justify-center text-xs text-muted-foreground">
            Loading plot…
          </div>
        )}
      </CardContent>
    </Card>
  );
}
