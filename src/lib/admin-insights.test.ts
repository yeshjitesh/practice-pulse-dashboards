import { describe, expect, it } from "vitest";
import { enquiriesToCsv, enquiryStats, filterEnquiries } from "./admin-insights";

const base = { email: "a@x.uk", practice: null, message: "Hello", created_at: "2026-11-10T10:00:00Z" };
const list = [
  { ...base, name: "Amy", status: "new", practice: "Oak Surgery" },
  { ...base, name: "Ben", status: "replied", email: "ben@nhs.net" },
  { ...base, name: "Cara", status: "closed", created_at: "2026-10-01T10:00:00Z" },
];

describe("admin enquiries", () => {
  it("filters by status", () => {
    expect(filterEnquiries(list, "new", "").map((e) => e.name)).toEqual(["Amy"]);
    expect(filterEnquiries(list, "all", "")).toHaveLength(3);
  });
  it("searches name, email and practice case-insensitively", () => {
    expect(filterEnquiries(list, "all", "oak").map((e) => e.name)).toEqual(["Amy"]);
    expect(filterEnquiries(list, "all", "NHS.NET").map((e) => e.name)).toEqual(["Ben"]);
  });
  it("counts statuses and the last 7 days", () => {
    expect(enquiryStats(list, new Date("2026-11-12T12:00:00Z"))).toEqual({ total: 3, new: 1, replied: 1, closed: 1, lastWeek: 2 });
  });
  it("neutralises spreadsheet formulas in exports", () => {
    const csv = enquiriesToCsv([{ ...base, name: "=HYPERLINK()", status: "new" }]);
    expect(csv).toContain(`"'=HYPERLINK()"`);
  });
});
