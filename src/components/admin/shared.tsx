import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAdminData, changeAdminData } from "@/lib/admin.functions";

export type AdminData = Awaited<ReturnType<typeof getAdminData>>;
export type Enquiry = AdminData["messages"][number];
export const ADMIN_KEY = ["admin-data"] as const;

export function useAdminData(initialData?: AdminData) {
  return useQuery({ queryKey: ADMIN_KEY, queryFn: () => getAdminData(), initialData });
}

export function useAdminChange() {
  const qc = useQueryClient();
  const change = useServerFn(changeAdminData);
  return async (input: Parameters<typeof changeAdminData>[0]["data"]) => {
    await change({ data: input });
    await qc.invalidateQueries({ queryKey: ADMIN_KEY });
  };
}

export const card = "rounded-xl border border-border bg-card p-4 sm:p-5";
export const field = "w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-ring/30";
export const label = "mb-1 block text-xs font-medium text-muted-foreground";

export const statusStyle: Record<string, string> = {
  new: "bg-peach text-foreground",
  replied: "bg-sky text-foreground",
  closed: "bg-sage text-foreground",
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusStyle[status] ?? "bg-secondary"}`}>{status}</span>;
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function SectionHeader({ title, description, children }: { title: string; description: string; children?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h2 className="font-display text-2xl text-primary sm:text-3xl">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}
