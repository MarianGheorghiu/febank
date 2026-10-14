import { MOCK_MESSAGES } from "../mock/messages";
import type { MessageCommand, MessagesSnapshot } from "../types/messages";
import { applyMessageCommand, MAX_REPLY_LENGTH } from "./engine";
export const messageStorageKey = (clientId: string) => `mbank_messages_v1:${encodeURIComponent(clientId)}`;
const isTime = (value: unknown): value is string => typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(value) && Number.isFinite(Date.parse(value));
const text = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
export function isMessagesSnapshot(value: unknown): value is MessagesSnapshot {
  try {
    const report = value as MessagesSnapshot;
    if (!report || report.schema_version !== 1 || !Number.isSafeInteger(report.revision) || report.revision < 0 || !isTime(report.as_of) || !Array.isArray(report.messages) || !report.drafts || typeof report.drafts !== "object" || Array.isArray(report.drafts)) return false;
    const ids = new Set<string>();
    const replyIds = new Set<string>();
    for (const message of report.messages) {
      if (!message || !text(message.id) || ids.has(message.id) || !["bank", "friend"].includes(message.type) || !["inbox", "archived", "deleted"].includes(message.folder) || !(message.previous_folder === null || ["inbox", "archived"].includes(message.previous_folder)) || !text(message.sender?.id) || !text(message.sender?.name) || !text(message.subject) || !text(message.body) || !isTime(message.created_at) || Date.parse(message.created_at) > Date.parse(report.as_of) || typeof message.can_reply !== "boolean" || !Array.isArray(message.replies)) return false;
      if (message.read_at !== null && (!isTime(message.read_at) || Date.parse(message.read_at) < Date.parse(message.created_at) || Date.parse(message.read_at) > Date.parse(report.as_of))) return false;
      ids.add(message.id);
      let previous = message.created_at;
      for (const reply of message.replies) {
        if (!reply || !text(reply.id) || replyIds.has(reply.id) || !text(reply.body) || reply.body.length > MAX_REPLY_LENGTH || !isTime(reply.created_at) || Date.parse(reply.created_at) < Date.parse(previous) || Date.parse(reply.created_at) > Date.parse(report.as_of) || !message.can_reply) return false;
        previous = reply.created_at; replyIds.add(reply.id);
      }
      if (message.amount !== null && (!message.amount || !/^\d+(\.\d{1,8})?$/.test(message.amount.value) || !Number.isFinite(Number(message.amount.value)) || !/^[A-Z]{3}$/.test(message.amount.currency) || !["incoming", "outgoing"].includes(message.amount.direction) || !text(message.amount.label))) return false;
      if (message.action !== null && (!message.action || !["settings", "transfers", "friends", "cards", "loans", "offers"].includes(message.action.target) || !text(message.action.label))) return false;
    }
    return Object.entries(report.drafts).every(([id, body]) => ids.has(id) && typeof body === "string" && body.length <= MAX_REPLY_LENGTH && report.messages.some(message => message.id === id && message.can_reply));
  } catch { return false; }
}
export interface MessageRepository {
  getSnapshot(): Promise<MessagesSnapshot>;
  execute(command: MessageCommand): Promise<MessagesSnapshot>;
}
/** Local mock only. Replace with the Go API adapter using the same interface. */
export function createMessageRepository(clientId: string): MessageRepository {
  const key = messageStorageKey(clientId);
  let snapshot = structuredClone(MOCK_MESSAGES);
  function read() {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const candidate: unknown = JSON.parse(raw);
          snapshot = isMessagesSnapshot(candidate) ? candidate : structuredClone(MOCK_MESSAGES);
        } else snapshot = structuredClone(MOCK_MESSAGES);
      } catch { snapshot = structuredClone(MOCK_MESSAGES); }
    }
    return structuredClone(snapshot);
  }
  return {
    async getSnapshot() { return read(); },
    async execute(command) {
      const current = read();
      const next = applyMessageCommand(current, command, new Date().toISOString());
      if (next.revision === current.revision) return next;
      if (typeof window !== "undefined") {
        try { localStorage.setItem(key, JSON.stringify(next)); }
        catch { throw new Error("Unable to save your changes. Check browser storage and retry."); }
      }
      snapshot = next;
      return structuredClone(snapshot);
    },
  };
}
