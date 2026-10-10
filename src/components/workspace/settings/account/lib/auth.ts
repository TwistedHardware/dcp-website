// src/components/workspace/settings/account/lib/auth.ts

export const API_BASE = "https://api.dcp.tc-sa.com";

/**
 * Builds the auth headers for all authenticated account API calls.
 * Reads `token` and `subject` from localStorage.
 */
export function authHeaders(): HeadersInit {
  const token = localStorage.getItem("token") || "";
  const subject = localStorage.getItem("subject") || "";
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    "x-subject": subject,
  };
}

/**
 * Called when any account API returns 401.
 *
 * TODO: wire this to the real logout flow (clear token/subject, redirect
 * to the language landing page). For now it only warns so parallel 401s
 * from multiple sections don't trigger multiple redirects.
 */
export function handleUnauthorized(lang: string): void {
  console.warn(`[account] unauthorized (lang=${lang}) — logout not implemented yet`);
}