import { getApiBaseUrl } from "../api/axiosConfig.js";

/**
 * Resolve image URL for display: data/blob as-is; localhost/relative rewritten to API base.
 * @param {string | null | undefined} url
 * @returns {string | null}
 */
export function resolveImageUrl(url) {
  if (!url) return null;
  const s = String(url).trim();
  if (s.startsWith("data:") || s.startsWith("blob:")) return s;

  if (/localhost|127\.0\.0\.1/.test(s)) {
    try {
      const parsed = new URL(s);
      const path =
        parsed.pathname + (parsed.search || "") + (parsed.hash || "");
      return getApiBaseUrl().replace(/\/+$/, "") + path;
    } catch {
      const path = s.replace(/^https?:\/\/[^/]+/, "");
      return getApiBaseUrl().replace(/\/+$/, "") + path;
    }
  }

  if (/^https?:\/\//i.test(s)) return s;

  const base = getApiBaseUrl().replace(/\/+$/, "");
  const path = s.replace(/^\/+/, "");
  return `${base}/${path}`;
}
