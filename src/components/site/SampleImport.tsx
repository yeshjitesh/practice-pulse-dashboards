import { useEffect, useRef, useState } from "react";
import { CheckCircle2, FileSpreadsheet, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSampleDashboard, sampleReports, SAMPLE_PROCESSING_MS } from "@/lib/sample-reports";
import type { Demo } from "@/lib/demo-data";

export function SampleImport({ onImported }: { onImported: (demo: Demo) => void }) {
  const [selected, setSelected] = useState("appointments");
  const [status, setStatus] = useState<"idle" | "processing" | "done">("idle");
  const [loaded, setLoaded] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  function run() {
    setStatus("processing");
    timer.current = setTimeout(() => {
      const demo = getSampleDashboard(selected);
      if (!demo) { setStatus("idle"); return; }
      onImported(demo);
      setLoaded(sampleReports.find((r) => r.id === selected)?.filename ?? "Sample report");
      setStatus("done");
    }, SAMPLE_PROCESSING_MS);
  }

  return <div className="mt-5 border-y border-border py-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <label className="min-w-0 flex-1 text-sm font-medium text-primary">Sample report
        <select value={selected} disabled={status === "processing"} onChange={(e) => { setSelected(e.target.value); setStatus("idle"); }} className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          {sampleReports.map((r) => <option key={r.id} value={r.id}>{r.filename}</option>)}
        </select>
      </label>
      <Button variant="brand" className="h-11 shrink-0 px-4" onClick={run} disabled={status === "processing"}>
        {status === "processing" ? <LoaderCircle className="motion-safe:animate-spin" /> : <FileSpreadsheet />}
        {status === "processing" ? "Preparing sample…" : "Try a sample report"}
      </Button>
    </div>
    <p role="status" className="mt-3 min-h-5 text-sm text-muted-foreground">
      {status === "done" ? <span className="flex items-start gap-2 text-primary"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />{loaded} loaded — sample figures updated.</span> : status === "processing" ? "Reading sample columns and preparing the dashboard…" : "Simulation only. Made-up reports, not official system exports. No files are uploaded."}
    </p>
  </div>;
}