declare module "plotly.js" {
  export type Data = Record<string, unknown>;
  export type Layout = Record<string, unknown>;
  export type PlotlyHTMLElement = HTMLElement;
  export const Plotly: unknown;
  export function toImage(
    gd: PlotlyHTMLElement,
    opts: { format: string; width: number; height: number; scale?: number },
  ): Promise<string>;
}

declare module "plotly.js-dist-min" {
  const Plotly: typeof import("plotly.js");
  export = Plotly;
}
declare module "react-plotly.js/factory" {
  import type { ComponentType } from "react";
  const createPlotComponent: (plotly: unknown) => ComponentType<Record<string, unknown>>;
  export default createPlotComponent;
}

