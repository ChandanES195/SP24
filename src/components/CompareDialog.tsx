import { useMemo, useState } from "react";
import { Table2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SIGNAL_ORDER, SIGNALS, getFs, type SignalId, type SignalParams } from "@/lib/signals";

interface Props {
  allParams: Record<string, SignalParams>;
}

export function CompareDialog({ allParams }: Props) {
  const [open, setOpen] = useState(false);

  const rows = useMemo(() => {
    return SIGNAL_ORDER.map((id) => {
      const def = SIGNALS[id];
      const p = allParams[id];
      const maxF = def.maxFreq(p);
      const m = def.markers(p);
      const Fs = getFs(id as SignalId, p);
      return {
        id,
        name: def.name,
        Fs,
        duration: p.duration,
        amplitude: p.amplitude,
        f0: m.f0,
        f1: m.f1,
        maxF,
        nyquistOk: maxF <= Fs / 2,
        params: def.params.map((pd) => `${pd.label}=${p[pd.key]}${pd.unit ?? ""}`).join(", "),
      };
    });
  }, [allParams]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Table2 className="h-4 w-4" />
          Compare
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Signal Comparison</DialogTitle>
          <DialogDescription>
            Current parameters and key derived values for all 7 signals.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Signal</TableHead>
                <TableHead>Fs (Hz)</TableHead>
                <TableHead>Dur (s)</TableHead>
                <TableHead>Amp</TableHead>
                <TableHead>f₀ (Hz)</TableHead>
                <TableHead>f₁ (Hz)</TableHead>
                <TableHead>Max f (Hz)</TableHead>
                <TableHead>Nyquist</TableHead>
                <TableHead>Specifics</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>{r.Fs}</TableCell>
                  <TableCell>{r.duration}</TableCell>
                  <TableCell>{r.amplitude.toFixed(2)}</TableCell>
                  <TableCell>{r.f0?.toPrecision(4) ?? "—"}</TableCell>
                  <TableCell>{r.f1?.toPrecision(4) ?? "—"}</TableCell>
                  <TableCell>{r.maxF.toFixed(1)}</TableCell>
                  <TableCell className={r.nyquistOk ? "text-emerald-600" : "text-destructive"}>
                    {r.nyquistOk ? "OK" : "Violated"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.params}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
