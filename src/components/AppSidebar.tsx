import { Activity, Play, RotateCcw } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  SIGNALS,
  defaultParamsFor,
  getFs,
  type SignalId,
  type SignalParams,
  validateParams,
} from "@/lib/signals";

interface Props {
  signalId: SignalId;
  params: SignalParams;
  dirty: boolean;
  onChange: (p: SignalParams) => void;
  onCompute: () => void;
  onReset?: () => void;
}


interface RowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  error?: string;
  accent?: string;
  onChange: (v: number) => void;
}

function ParamRow({ label, value, min, max, step, unit, error, accent, onChange }: RowProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs font-medium">{label}</Label>
        <div className="flex items-center gap-1">
          <Input
            type="number"
            value={Number.isFinite(value) ? value : ""}
            min={min}
            max={max}
            step={step}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="h-7 w-20 text-xs"
          />
          {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
        </div>
      </div>
      <Slider
        value={[Number.isFinite(value) ? value : min]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(v[0])}
        style={accent ? ({ ["--primary" as string]: accent } as React.CSSProperties) : undefined}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function AppSidebar({ signalId, params, dirty, onChange, onCompute, onReset }: Props) {
  const def = SIGNALS[signalId];
  const errors = validateParams(signalId, params);
  const errMap = Object.fromEntries(errors.map((e) => [e.key, e.message]));
  const Fs = getFs(signalId, params);

  const set = (key: string, v: number) => onChange({ ...params, [key]: v });
  const reset = () => {
    onChange(defaultParamsFor(signalId));
    onReset?.();
  };

  const canCompute = errors.length === 0;

  return (
    <Sidebar>
      <SidebarHeader>
        <div
          className="flex items-center gap-2 rounded-md px-2 py-2"
          style={{ background: `linear-gradient(135deg, ${def.accent}22, transparent)` }}
        >
          <Activity className="h-5 w-5" style={{ color: def.accent }} />
          <div className="flex-1">
            <p className="text-sm font-semibold">Variable Manager</p>
            <p className="text-xs text-muted-foreground">{def.name}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={reset}
            title="Reset to defaults"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Signal Parameters</SidebarGroupLabel>
          <SidebarGroupContent className="space-y-4 px-2 pt-2">
            {def.params.map((p) => (
              <ParamRow
                key={p.key}
                label={p.label}
                unit={p.unit}
                value={params[p.key]}
                min={p.min}
                max={p.max}
                step={p.step}
                error={errMap[p.key]}
                accent={def.accent}
                onChange={(v) => set(p.key, v)}
              />
            ))}
            <ParamRow
              label="Amplitude"
              value={params.amplitude}
              min={0}
              max={1}
              step={0.01}
              error={errMap.amplitude}
              accent={def.accent}
              onChange={(v) => set("amplitude", v)}
            />
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Time & View</SidebarGroupLabel>
          <SidebarGroupContent className="space-y-4 px-2 pt-2">
            <ParamRow
              label="Duration"
              unit="s"
              value={params.duration}
              min={0.1}
              max={10}
              step={0.1}
              error={errMap.duration}
              accent={def.accent}
              onChange={(v) => set("duration", v)}
            />
            {!def.isChirp && (
              <ParamRow
                label="Cycles (time view)"
                value={params.cycles}
                min={1}
                max={200}
                step={1}
                error={errMap.cycles}
                accent={def.accent}
                onChange={(v) => set("cycles", v)}
              />
            )}
            <div className="flex items-center justify-between rounded-md border bg-muted/40 px-2 py-1.5">
              <span className="text-xs text-muted-foreground">Auto sample rate</span>
              <Badge variant="secondary" className="font-mono text-[11px]">
                Fs = {(Fs / 1000).toFixed(1)} kHz
              </Badge>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="gap-2">
        <Button
          onClick={onCompute}
          disabled={!canCompute}
          className="h-11 w-full gap-2 font-semibold text-white shadow-md transition-transform hover:scale-[1.01] active:scale-[0.99]"
          style={{
            background: `linear-gradient(135deg, ${def.accent}, ${def.accent}cc)`,
          }}
        >
          <Play className="h-4 w-4" fill="currentColor" />
          Compute & Plot
        </Button>
        {dirty && canCompute && (
          <p className="text-center text-[11px] font-medium text-amber-600 dark:text-amber-400">
            Parameters changed — click to refresh
          </p>
        )}
        <p className="px-2 py-1 text-[10px] leading-tight text-muted-foreground">
          Tip: scroll-zoom inside any plot, drag to pan, double-click to autoscale.
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
