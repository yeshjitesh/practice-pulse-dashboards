import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMailbox, getMailThread, getMailSetup, updateMailThreads, deleteMailThreads, changeMailFolder, type MailView } from "@/lib/mail.functions";

export type Mailbox = Awaited<ReturnType<typeof getMailbox>>;
export type MailThread = Mailbox["threads"][number];
export type ThreadDetail = NonNullable<Awaited<ReturnType<typeof getMailThread>>>;
export type MailMessage = ThreadDetail["messages"][number];
export type { MailView };

export type ListParams = { view: MailView; folderId?: string; q?: string; unread?: boolean; starred?: boolean; attachments?: boolean };

export function useMailbox(params: ListParams) {
  const fetchBox = useServerFn(getMailbox);
  return useQuery({ queryKey: ["mail", "list", params], queryFn: () => fetchBox({ data: params }), // Keep the old list only while refining the same folder (e.g. typing a search), never across folders.
    placeholderData: (prev, prevQuery) => {
      const old = prevQuery?.queryKey[2] as ListParams | undefined;
      return old && old.view === params.view && old.folderId === params.folderId ? prev : undefined;
    }, refetchInterval: 30_000 });
}

export function useThread(id: string | null) {
  const fetchThread = useServerFn(getMailThread);
  return useQuery({ queryKey: ["mail", "thread", id], queryFn: () => fetchThread({ data: { id: id! } }), enabled: !!id });
}

export function useMailSetup() {
  const fetchSetup = useServerFn(getMailSetup);
  return useQuery({ queryKey: ["mail-setup"], queryFn: () => fetchSetup() });
}

export function useMailActions() {
  const qc = useQueryClient();
  const update = useServerFn(updateMailThreads);
  const remove = useServerFn(deleteMailThreads);
  const folder = useServerFn(changeMailFolder);
  const refresh = () => qc.invalidateQueries({ queryKey: ["mail"] });
  return {
    refresh,
    update: async (input: Parameters<typeof updateMailThreads>[0]["data"]) => { await update({ data: input }); await refresh(); },
    remove: async (input: Parameters<typeof deleteMailThreads>[0]["data"]) => { const r = await remove({ data: input }); await refresh(); return r; },
    folder: async (input: Parameters<typeof changeMailFolder>[0]["data"]) => { const r = await folder({ data: input }); await refresh(); return r; },
  };
}

export function timeLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  if (d.getFullYear() === now.getFullYear()) return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
