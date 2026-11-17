import { demos, type Demo } from "@/lib/demo-data";

export const SAMPLE_PROCESSING_MS = 1000;
export const sampleReports = [
  { id: "appointments", filename: "Sample SystmOne Appts.csv", bars: [280, 260, 240, 220, 200], firstValue: "1,200", firstNote: "In this sample report" },
  { id: "qof", filename: "Sample EMIS QOF extract.csv", bars: [20, 38, 54, 72, 85], firstValue: "540 / 635", firstNote: "85% achieved" },
] as const;

// Synthetic fixtures only: no files are selected, transmitted or retained.
export function getSampleDashboard(id: string): Demo | undefined {
  const report = sampleReports.find((r) => r.id === id);
  const demo = demos.find((d) => d.id === id);
  if (!report || !demo) return undefined;
  return {
    ...demo,
    bars: demo.bars.map(([label], i) => [label, report.bars[i] ?? 0]),
    kpis: demo.kpis.map(([label, value, note, tint], i) => [label, i === 0 ? report.firstValue : value, i === 0 ? report.firstNote : note, tint]),
  };
}