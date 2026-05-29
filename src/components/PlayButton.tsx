import { useEffect, useState } from "react";
import { Pause, Play } from "lucide-react";
import { playSignal, stopSignal } from "@/lib/audio/playback";
import { cn } from "@/lib/utils";

interface Props {
  samples?: Float32Array;
  Fs: number;
  accent?: string;
}

export function PlayButton({ samples, Fs, accent }: Props) {
  const [playing, setPlaying] = useState(false);

  useEffect(() => () => stopSignal(), []);

  const toggle = () => {
    if (!samples) return;
    if (playing) {
      stopSignal();
      setPlaying(false);
      return;
    }
    playSignal(samples, Fs);
    setPlaying(true);
    // Estimate duration: samples / Fs
    const ms = (samples.length / Fs) * 1000;
    window.setTimeout(() => setPlaying(false), ms + 200);
  };

  const disabled = !samples;

  return (
    <button
      type="button"
      aria-label={playing ? "Stop" : "Play"}
      disabled={disabled}
      onClick={toggle}
      className={cn(
        "relative flex h-16 w-16 items-center justify-center rounded-full text-white shadow-2xl transition-transform hover:scale-105 active:scale-95",
        !accent && "bg-gradient-to-br from-emerald-400 to-emerald-600",
        playing && "bg-gradient-to-br from-rose-400 to-rose-600",
        disabled && "cursor-not-allowed opacity-40",
      )}
      style={
        accent && !playing
          ? { background: `linear-gradient(135deg, ${accent}, ${accent}cc)` }
          : undefined
      }
    >
      {playing && (
        <span className="absolute inset-0 animate-ping rounded-full bg-rose-400/40" aria-hidden />
      )}
      {playing ? <Pause className="h-7 w-7" /> : <Play className="ml-1 h-7 w-7" />}
    </button>
  );
}
