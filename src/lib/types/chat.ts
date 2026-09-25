export interface ChatSession {
  sessionId: string;
  createdAt: string;
  lastUpdate: string;
  seq: number;
  title: string;
  isSecret: boolean;
  userId: string;
  isGeneratingTitle?: boolean; // Client-side flag for placeholder skeleton
}

export interface BackendChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export function formatSessionTimestamp(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return d.toLocaleDateString([], { weekday: "short" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export type ModelId = "fast" | "pro" | "deep-research";

export type UploadedFile = {
  id: string;
  name: string;
  mime: string;
  size: number;
  url?: string;
  status: "uploading" | "done" | "error";
  /** raw File kept around so retry can re-upload */
  _file?: File;
  /** local object URL for image preview, revoked on remove */
  _previewUrl?: string;
  error?: string;
};