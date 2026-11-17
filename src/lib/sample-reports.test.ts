import { describe, expect, it } from "vitest";
import { getSampleDashboard, SAMPLE_PROCESSING_MS } from "./sample-reports";

describe("sample-only report simulation", () => {
  it("processes the simulation for one second", () => {
    expect(SAMPLE_PROCESSING_MS).toBe(1000);
  });
  it("populates the appointments fixture with its report totals", () => {
    const d = getSampleDashboard("appointments");
    expect(d?.bars.reduce((sum, [, n]) => sum + n, 0)).toBe(1200);
    expect(d?.kpis[0]?.[1]).toBe("1,200");
  });
  it("populates the QOF fixture without accepting arbitrary reports", () => {
    expect(getSampleDashboard("qof")?.kpis[0]?.[1]).toBe("540 / 635");
    expect(getSampleDashboard("patient-upload.csv")).toBeUndefined();
  });
});