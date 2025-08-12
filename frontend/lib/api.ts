import { useAuth } from "@clerk/clerk-expo";
import Constants from "expo-constants";

const RAW_BASE_URL: string | undefined =
  (Constants?.expoConfig?.extra as { API_URL?: string } | undefined)?.API_URL ??
  // Fallback for classic manifest in older Expo runtimes
  (Constants as any)?.manifest?.extra?.API_URL ??
  "http://localhost:3000";
const BASE_URL = (RAW_BASE_URL || "").replace(/\/+$/, "");

export function useApi() {
  const { getToken, isSignedIn } = useAuth();

  /**
   * Perform an HTTP request to the Rails API.
   * Callers should pass full API paths that begin with '/api/v1/...'.
   */
  async function request<T = unknown>(
    path: string,
    init: RequestInit = {}
  ): Promise<T> {
    const body = (init as any).body;
    const isFormData =
      typeof FormData !== "undefined" && body instanceof FormData;

    const doFetch = async (maybeToken: string | null) =>
      fetch(`${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`, {
        ...init,
        headers: {
          ...(isFormData ? {} : { "Content-Type": "application/json" }),
          ...(init.headers || ({} as any)),
          ...(maybeToken ? { Authorization: `Bearer ${maybeToken}` } : {}),
        },
      });

    // First attempt
    let token = await getToken();
    let res = await doFetch(token ?? null);

    // Single soft retry on 401 when signed in
    if (res.status === 401 && isSignedIn) {
      token = await getToken();
      res = await doFetch(token ?? null);
    }

    const text = await res.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {}

    if (!res.ok)
      throw new Error(data?.error || data?.message || res.statusText);
    return data as T;
  }

  return {
    get: <T>(p: string) => request<T>(p),
    post: <T>(p: string, body?: unknown) =>
      request<T>(p, {
        method: "POST",
        body:
          typeof FormData !== "undefined" && body instanceof FormData
            ? (body as any)
            : JSON.stringify(body),
      }),
    put: <T>(p: string, body?: unknown) =>
      request<T>(p, { method: "PUT", body: JSON.stringify(body) }),
    patch: <T>(p: string, body?: unknown) =>
      request<T>(p, { method: "PATCH", body: JSON.stringify(body) }),
    del: <T>(p: string) => request<T>(p, { method: "DELETE" }),
    postForm: <T>(p: string, form: FormData) =>
      request<T>(p, { method: "POST", body: form as any }),
  };
}
