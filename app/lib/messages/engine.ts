import type { Message, MessageCommand, MessageFilters, MessagesSnapshot } from "../types/messages";
export const MAX_REPLY_LENGTH = 4000;
export function belongsToFolder(message: Message, folder: MessageFilters["folder"]) {
  return folder === "replied" ? message.folder !== "deleted" && message.replies.length > 0 : message.folder === folder;
}
export function filterMessages(snapshot: MessagesSnapshot, filters: MessageFilters) {
  const query = filters.query.trim().toLocaleLowerCase();
  return snapshot.messages.filter(message => belongsToFolder(message, filters.folder) && (filters.category === "all" || message.type === filters.category) && (!filters.unread_only || message.read_at === null) && (!query || [message.subject, message.body, message.sender.name, ...message.replies.map(reply => reply.body)].some(text => text.toLocaleLowerCase().includes(query)))).sort((a,b) => Date.parse(b.replies.at(-1)?.created_at ?? b.created_at) - Date.parse(a.replies.at(-1)?.created_at ?? a.created_at) || b.id.localeCompare(a.id));
}
export function messageCounts(snapshot: MessagesSnapshot) {
  const inbox = snapshot.messages.filter(message => message.folder === "inbox");
  return { inbox: inbox.length, unread: inbox.filter(message => message.read_at === null).length, bank: inbox.filter(message => message.type === "bank" && message.read_at === null).length, replied: snapshot.messages.filter(message => belongsToFolder(message, "replied")).length, archived: snapshot.messages.filter(message => message.folder === "archived").length, deleted: snapshot.messages.filter(message => message.folder === "deleted").length };
}
export function applyMessageCommand(snapshot: MessagesSnapshot, command: MessageCommand, at: string): MessagesSnapshot {
  if (!Number.isFinite(Date.parse(at))) throw new Error("Invalid timestamp.");
  const next = structuredClone(snapshot);
  const time = new Date(Math.max(Date.parse(snapshot.as_of), Date.parse(at))).toISOString();
  const ids = "ids" in command ? [...new Set(command.ids)] : [command.id];
  if (!ids.length || ids.some(id => !next.messages.some(message => message.id === id))) throw new Error("This conversation is no longer available. Refresh the list and retry.");
  const rows = next.messages.filter(message => ids.includes(message.id));
  if (command.kind === "reply" || command.kind === "save_draft") {
    const message = rows[0];
    if (!message.can_reply || (command.kind === "reply" && message.folder === "deleted")) throw new Error("Replies are unavailable for this conversation.");
    if (command.body.length > MAX_REPLY_LENGTH) throw new Error(`Replies may contain at most ${MAX_REPLY_LENGTH} characters.`);
    if (command.kind === "reply") {
      const body = command.body.trim();
      if (!body) throw new Error("Write a reply before sending.");
      if (!command.reply_id.trim()) throw new Error("Reply identifier is required.");
      const existing = next.messages.flatMap(row => row.replies).find(reply => reply.id === command.reply_id);
      if (existing) {
        if (message.replies.some(reply => reply.id === existing.id) && existing.body === body) return snapshot;
        throw new Error("Reply identifier is already in use.");
      }
      message.replies.push({ id: command.reply_id, body, created_at: time });
      message.read_at = time;
      delete next.drafts[message.id];
    } else {
      if ((next.drafts[message.id] ?? "") === command.body) return snapshot;
      if (command.body) next.drafts[message.id] = command.body;
      else delete next.drafts[message.id];
    }
  } else if (command.kind === "purge") {
    if (rows.some(message => message.folder !== "deleted")) throw new Error("Only conversations in Trash can be permanently deleted.");
    next.messages = next.messages.filter(message => !ids.includes(message.id));
    ids.forEach(id => delete next.drafts[id]);
  } else {
    for (const message of rows) {
      switch (command.kind) {
        case "mark_read": message.read_at ??= time; break;
        case "mark_unread": message.read_at = null; break;
        case "archive":
          if (message.folder === "deleted") throw new Error("Restore this conversation before archiving it.");
          message.folder = "archived"; break;
        case "unarchive":
          if (message.folder === "deleted") throw new Error("Restore this conversation before moving it to Inbox.");
          message.folder = "inbox"; break;
        case "trash":
          if (message.folder !== "deleted") { message.previous_folder = message.folder; message.folder = "deleted"; }
          break;
        case "restore":
          if (message.folder !== "deleted") throw new Error("Only conversations in Trash can be restored.");
          message.folder = message.previous_folder ?? "inbox";
          message.previous_folder = null; break;
        default: throw new Error("Unsupported message operation.");
      }
    }
  }
  next.revision += 1;
  next.as_of = time;
  return next;
}
