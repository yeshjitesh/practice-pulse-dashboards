export type EnquiryStatus = "new" | "replied" | "closed";
export const ENQUIRY_STATUSES: EnquiryStatus[] = ["new", "replied", "closed"];

type EnquiryLike = {
  name: string; email: string; practice: string | null; message: string;
  status: string; created_at: string; [key: string]: unknown;
};

/** Filters enquiries by status ("all" keeps every status) and a case-insensitive search across name, email, practice and message. */
export function filterEnquiries<T extends EnquiryLike>(list: T[], status: EnquiryStatus | "all", search: string): T[] {
  const term = search.trim().toLowerCase();
  return list.filter((e) => {
    if (status !== "all" && e.status !== status) return false;
    if (!term) return true;
    return [e.name, e.email, e.practice ?? "", e.message].some((v) => v.toLowerCase().includes(term));
  });
}

/** Counts enquiries per status plus those received in the last 7 days. */
export function enquiryStats(list: EnquiryLike[], now = new Date()) {
  const weekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const counts = { total: list.length, new: 0, replied: 0, closed: 0, lastWeek: 0 };
  for (const e of list) {
    if (e.status === "new" || e.status === "replied" || e.status === "closed") counts[e.status] += 1;
    if (new Date(e.created_at).getTime() >= weekAgo) counts.lastWeek += 1;
  }
  return counts;
}

const CSV_COLUMNS = ["created_at", "status", "name", "email", "phone", "practice", "job_role", "organisation_type", "list_size", "clinical_system", "timeline", "contact_preference", "heard_about", "interests", "message"] as const;

function csvCell(value: unknown) {
  const text = Array.isArray(value) ? value.join("; ") : value == null ? "" : String(value);
  // Neutralise spreadsheet formulas and quote every cell.
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function enquiriesToCsv(list: EnquiryLike[]) {
  const rows = list.map((e) => CSV_COLUMNS.map((c) => csvCell(e[c])).join(","));
  return [CSV_COLUMNS.join(","), ...rows].join("\r\n");
}
