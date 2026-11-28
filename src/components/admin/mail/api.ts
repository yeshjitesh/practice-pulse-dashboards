import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getMailbox, getMailThread, getMailSetup, updateMailThreads, deleteMailThreads, changeMailFolder, listMailTemplates, saveMailTemplate, deleteMailTemplate,
  saveMailSignature, linkMailEnquiry, cancelScheduledMail, type MailView,
} from "@/lib/mail.functions";

export type Mailbox = Awaited<ReturnType<typeof getMailbox>>;
export type MailThread = Mailbox["threads"][number];
export type ThreadDetail = NonNullable<Awaited<ReturnType<typeof getMailThread>>>;
export type MailMessage = ThreadDetail["messages"][number];
export type { MailView };

export type MailTemplate = Awaited<ReturnType<typeof listMailTemplates>>[number];
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

export function useMailTemplates() {
  const fetchTemplates = useServerFn(listMailTemplates);
  return useQuery({ queryKey: ["mail-templates"], queryFn: () => fetchTemplates() });
}

export function useMailSettingsActions() {
  const qc = useQueryClient();
  const saveTemplate = useServerFn(saveMailTemplate);
  const removeTemplate = useServerFn(deleteMailTemplate);
  const saveSignature = useServerFn(saveMailSignature);
  const link = useServerFn(linkMailEnquiry);
  const cancel = useServerFn(cancelScheduledMail);
  return {
    saveTemplate: async (input: Parameters<typeof saveMailTemplate>[0]["data"]) => { const r = await saveTemplate({ data: input }); await qc.invalidateQueries({ queryKey: ["mail-templates"] }); return r; },
    removeTemplate: async (id: string) => { await removeTemplate({ data: { id } }); await qc.invalidateQueries({ queryKey: ["mail-templates"] }); },
    saveSignature: async (html: string) => { await saveSignature({ data: { html } }); await qc.invalidateQueries({ queryKey: ["mail-setup"] }); },
    link: async (threadId: string, enquiryId: string | null) => {
      await link({ data: { threadId, enquiryId } });
      await Promise.all([qc.invalidateQueries({ queryKey: ["mail"] }), qc.invalidateQueries({ queryKey: ["enquiry-mail"] })]);
    },
    cancelScheduled: async (messageId: string) => { const r = await cancel({ data: { messageId } }); await qc.invalidateQueries({ queryKey: ["mail"] }); return r; },
  };
}

export function whenLabel(d: Date) {
  return d.toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

/** A Date as the value a datetime-local input expects, in local time. */
export function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
