import { useCallback, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Waves } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AppSidebar } from "@/components/AppSidebar";
import { SignalView } from "@/components/SignalView";
import { CompareDialog } from "@/components/CompareDialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  SIGNAL_ORDER,
  SIGNALS,
  defaultParamsFor,
  getFs,
  type SignalId,
  type SignalParams,
} from "@/lib/signals";

export const Route = createFileRoute("/")({
  component: Index,
});

function paramsEqual(a: SignalParams | null, b: SignalParams | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  for (const k of ka) if (a[k] !== b[k]) return false;
  return true;
}

function Index() {
  const [active, setActive] = useState<SignalId>("sine");
  const [draftParams, setDraftParams] = useState<Record<SignalId, SignalParams>>(() => {
    const o = {} as Record<SignalId, SignalParams>;
    SIGNAL_ORDER.forEach((id) => (o[id] = defaultParamsFor(id)));
    return o;
  });
  const [committedParams, setCommittedParams] = useState<Record<SignalId, SignalParams | null>>(
    () => {
      const o = {} as Record<SignalId, SignalParams | null>;
      SIGNAL_ORDER.forEach((id) => (o[id] = null));
      return o;
    },
  );

  const setDraft = useCallback(
    (p: SignalParams) => setDraftParams((prev) => ({ ...prev, [active]: p })),
    [active],
  );

  const commit = useCallback(() => {
    setCommittedParams((prev) => ({
      ...prev,
      [active]: { ...draftParams[active], Fs: getFs(active, draftParams[active]) },
    }));
  }, [active, draftParams]);

  const resetCommitted = useCallback(
    () => setCommittedParams((prev) => ({ ...prev, [active]: null })),
    [active],
  );

  const dirty = !paramsEqual(draftParams[active], committedParams[active]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar
          signalId={active}
          params={draftParams[active]}
          dirty={dirty}
          onChange={setDraft}
          onCompute={commit}
          onReset={resetCommitted}
        />

        <div className="flex flex-1 flex-col">
          <header
            className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b px-4 backdrop-blur"
            style={{
              background:
                "linear-gradient(90deg, rgba(59,130,246,0.10), rgba(168,85,247,0.10), rgba(236,72,153,0.10))",
            }}
          >
            <SidebarTrigger />
            <div className="rounded-md bg-gradient-to-br from-blue-500 to-purple-600 p-1.5 text-white shadow-sm">
              <Waves className="h-4 w-4" />
            </div>
            <h1 className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-xs font-bold tracking-tight text-transparent sm:text-base">
              Chandan's Signal Generator &amp; Analyzer
            </h1>
            <span className="hidden text-xs text-muted-foreground sm:inline">
              Time · FFT · STFT
            </span>
            <div className="ml-auto flex items-center gap-2">
              <ThemeToggle />
              <CompareDialog allParams={draftParams} />
            </div>
          </header>
          <main className="flex-1 p-4 lg:p-6">
            <Tabs value={active} onValueChange={(v) => setActive(v as SignalId)}>
              <TabsList className="mb-4 flex h-auto w-full flex-wrap justify-start gap-1 bg-muted/50 p-1">
                {SIGNAL_ORDER.map((id) => {
                  const isActive = active === id;
                  return (
                    <TabsTrigger
                      key={id}
                      value={id}
                      className="text-xs font-medium transition-colors data-[state=active]:text-white sm:text-sm"
                      style={
                        isActive
                          ? {
                              background: `linear-gradient(135deg, ${SIGNALS[id].accent}, ${SIGNALS[id].accent}cc)`,
                            }
                          : undefined
                      }
                    >
                      {SIGNALS[id].shortName}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
              {SIGNAL_ORDER.map((id) => (
                <TabsContent key={id} value={id} className="mt-0">
                  {active === id && (
                    <SignalView signalId={id} params={committedParams[id]} />
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
