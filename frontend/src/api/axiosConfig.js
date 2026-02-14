import axios from "axios";

const rawBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
const baseURL = rawBase.replace(/\/+$/, "");

/**
 * Returns the API base URL (same as used by the axios instance).
 * Use for resolveImageUrl and other URL construction.
 */
export function getApiBaseUrl() {
  return baseURL;
}

let tokenGetter = null;

/**
 * Set the async function used to obtain the auth token (e.g. Clerk getToken).
 * Call once from a component that has useAuth() (e.g. in App or an auth wrapper).
 * @param {() => Promise<string | null>} fn
 */
export function setTokenGetter(fn) {
  tokenGetter = fn;
}

const api = axios.create({
  baseURL,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

api.interceptors.request.use(
  async (config) => {
    if (typeof tokenGetter === "function") {
      try {
        const token = await tokenGetter();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch {
        // no token attached
      }
    }
    if (import.meta.env.DEV) {
      console.debug("[api]", config.method?.toUpperCase(), config.url);
    }
    return config;
  },
  (err) => Promise.reject(err)
);

function normalizeError(err) {
  const isDev = import.meta.env.DEV;
  if (err.response) {
    const status = err.response.status;
    const data = err.response.data;
    const serverMessage =
      (data && (data.message || data.detail || data.error)) ||
      (typeof data === "string" ? data : null);
    let message;
    switch (status) {
      case 401:
        message = "Unauthorized. Please sign in.";
        break;
      case 403:
        message = "Forbidden.";
        break;
      case 409:
        message = serverMessage || "Conflict.";
        break;
      case 500:
      default:
        message = serverMessage || `Request failed (${status}).`;
    }
    if (isDev) {
      console.error("[api error]", status, err.config?.url, message);
    }
    const out = new Error(message);
    out.status = status;
    out.code = err.code;
    out.response = err.response;
    return out;
  }
  const message =
    err.code === "ECONNABORTED"
      ? "Request timed out."
      : err.message || "Network error.";
  if (isDev) {
    console.error("[api error]", message, err.config?.url);
  }
  const out = new Error(message);
  out.status = null;
  out.code = err.code;
  return out;
}

api.interceptors.response.use(
  (response) => response,
  (err) => Promise.reject(normalizeError(err))
);

export default api;
